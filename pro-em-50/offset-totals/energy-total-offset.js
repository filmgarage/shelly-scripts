/**
 * Shelly Pro EM - Energy Offset Script with Zero Button
 * 
 * IMPORTANT: Before running this script, you must manually add virtual components:
 * - 3 Number components for DISPLAY (IDs: 200, 201, 202) - unit: kWh
 * - 3 Number components for OFFSETS (IDs: 203, 204, 205) - unit: kWh
 * - 1 Button component for ZERO (ID: 200) - to reset displays to 0
 * 
 * See README.md for step-by-step setup instructions.
 * 
 * This script calculates:
 * - Channel 1: (API energy / 1000) + Channel 1 offset = kWh
 * - Channel 2: (API energy / 1000) + Channel 2 offset = kWh
 * - Total: (API Ch1 + API Ch2) / 1000 + Total offset = kWh
 * 
 * Note: Total uses RAW API values, not adjusted channel displays!
 * 
 * Zero Button (ID 200):
 * - Press to set all offsets to negative of current energy
 * - This makes all displays show 0.000 kWh
 * - Useful for monitoring specific time periods
 * 
 * Offsets can be modified via:
 * - Shelly web interface (Virtual Components section)
 * - HTTP: http://IP/rpc/Number.Set?id=203&value=VALUE
 * - Home Assistant: exposed as number entities (supports both comma and dot decimals)
 */

let CONFIG = {
  updateInterval: 10000,  // Update every 10 seconds
  
  // EM component IDs (Pro EM has two energy meters)
  emIds: {
    channel1: 0,  // First energy meter (em:0)
    channel2: 1   // Second energy meter (em:1)
  },
  
  // Virtual component IDs (must match the IDs you created manually)
  virtualIds: {
    channel1: 200,      // Number component for Channel 1 display (kWh)
    channel2: 201,      // Number component for Channel 2 display (kWh)
    total: 202,         // Number component for Total display (kWh)
    offsetCh1: 203,     // Number component for Channel 1 offset (kWh)
    offsetCh2: 204,     // Number component for Channel 2 offset (kWh)
    offsetTotal: 205,   // Number component for Total offset (kWh)
    zeroButton: 200     // Button component to zero all displays
  }
};

// Get offset value from virtual number component
function getOffset(numberId) {
  let result = Shelly.getComponentStatus("number:" + JSON.stringify(numberId));
  if (result && result.value !== null && result.value !== undefined) {
    // If it's already a number, return it
    if (typeof result.value === "number") {
      return result.value;
    }
    // If it's a string, convert it (handle both comma and dot)
    if (typeof result.value === "string") {
      let normalized = result.value.replace(",", ".");
      let parsed = parseFloat(normalized);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

// Get energy value from EM1Data component (returns kWh)
function getEMEnergy(emId, callback) {
  Shelly.call("EM1Data.GetStatus", { id: emId }, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("Error getting EM1Data status for channel", emId, ":", error_message);
      callback(0);
      return;
    }
    // Convert Wh to kWh
    let energyKwh = (result.total_act_energy || 0) / 1000;
    callback(energyKwh);
  });
}

// Zero all displays by setting offsets to negative of current energy
function zeroAllDisplays() {
  print("Zero button pressed - resetting all displays to 0...");
  
  // Get energy from both channels
  getEMEnergy(CONFIG.emIds.channel1, function(energyCh1) {
    getEMEnergy(CONFIG.emIds.channel2, function(energyCh2) {
      
      // Calculate total from RAW API values (not adjusted)
      let energyTotal = energyCh1 + energyCh2;
      
      // Set offsets to negative of current values
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.offsetCh1,
        value: -energyCh1
      });
      
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.offsetCh2,
        value: -energyCh2
      });
      
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.offsetTotal,
        value: -energyTotal
      });
      
      print("Offsets set:");
      print("  Channel 1:", -energyCh1, "kWh");
      print("  Channel 2:", -energyCh2, "kWh");
      print("  Total:", -energyTotal, "kWh");
      print("All displays will show 0.000 kWh on next update.");
    });
  });
}

// Update energy values with offsets
function updateEnergyValues() {
  // Get energy from both channels
  getEMEnergy(CONFIG.emIds.channel1, function(energyCh1) {
    getEMEnergy(CONFIG.emIds.channel2, function(energyCh2) {
      
      // Get offsets (in kWh)
      let offsetCh1 = getOffset(CONFIG.virtualIds.offsetCh1);
      let offsetCh2 = getOffset(CONFIG.virtualIds.offsetCh2);
      let offsetTotal = getOffset(CONFIG.virtualIds.offsetTotal);
      
      // Calculate adjusted values for each channel (API value + offset)
      let adjustedCh1 = energyCh1 + offsetCh1;
      let adjustedCh2 = energyCh2 + offsetCh2;
      
      // Calculate total from RAW API values + total offset (NOT from adjusted channels)
      let rawTotal = energyCh1 + energyCh2;
      let adjustedTotal = rawTotal + offsetTotal;
      
      // Update virtual number components (values in kWh)
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.channel1,
        value: adjustedCh1
      });
      
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.channel2,
        value: adjustedCh2
      });
      
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.total,
        value: adjustedTotal
      });
      
      // Optional: Print to console for debugging
      // print("Updated - Ch1:", adjustedCh1, "Ch2:", adjustedCh2, "Total:", adjustedTotal);
    });
  });
}

// Start periodic updates
Timer.set(CONFIG.updateInterval, true, function() {
  updateEnergyValues();
});

// Do an immediate first update
updateEnergyValues();

// Listen for button press events to zero displays
Shelly.addEventHandler(function(event) {
  if (event.component === "button:" + CONFIG.virtualIds.zeroButton && event.info.event === "single_push") {
    zeroAllDisplays();
  }
});

print("Shelly Pro EM Energy Offset Script started!");
print("Update interval:", CONFIG.updateInterval, "ms");
print("");
print("Make sure virtual components are created:");
print("  - Number components for DISPLAY: 200, 201, 202 (unit: kWh)");
print("  - Number components for OFFSETS: 203, 204, 205 (unit: kWh)");
print("  - Button component for ZERO: 200");
print("");
print("Calculation:");
print("  Channel 1/2: (API value / 1000) + offset");
print("  Total: (RAW API Ch1 + RAW API Ch2) / 1000 + total offset");
print("Press Button 200 to zero all displays (sets offsets to -current values)");
print("");
print("To modify offsets via HTTP:");
print("  Channel 1: http://YOUR_IP/rpc/Number.Set?id=203&value=VALUE");
print("  Channel 2: http://YOUR_IP/rpc/Number.Set?id=204&value=VALUE");
print("  Total:     http://YOUR_IP/rpc/Number.Set?id=205&value=VALUE");
print("(VALUE in kWh, both dot and comma decimals supported)");
