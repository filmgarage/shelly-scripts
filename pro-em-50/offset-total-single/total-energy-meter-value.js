/**
 * Shelly Pro EM - Simple Meter Synchronization Script
 * 
 * IMPORTANT: Before running this script, you must manually add virtual components:
 * - 1 Number component for METER START VALUE (ID: 200) - unit: kWh - type: field
 * - 1 Number component for METER TOTAL ENERGY (ID: 201) - unit: kWh - type: label
 * - 1 Button component OPTIONAL for ZERO (ID: 200) - to reset to current Shelly value
 * 
 * This script synchronizes your Shelly with your utility meter:
 * 
 * How it works:
 * 1. You enter your utility meter reading in "Meter Start Value" (200)
 * 2. Script calculates offset ONCE: offset = your reading - Shelly total
 * 3. Offset is stored internally (you never see it)
 * 4. Every 10s, "Meter Total Energy" (201) = Shelly total + fixed offset
 * 5. Offset only changes when YOU change "Meter Start Value"
 * 
 * Example:
 * - You enter: Meter Start Value = 12,345 kWh
 * - Shelly shows: 5,000 kWh (both channels combined)
 * - Offset calculated: 7,345 kWh (internal, fixed)
 * - Meter Total Energy shows: 12,345 kWh (matches your input!)
 * 
 * Hours later:
 * - Meter Start Value: 12,345 kWh (unchanged)
 * - Shelly shows: 5,002 kWh (increased)
 * - Offset: 7,345 kWh (still fixed!)
 * - Meter Total Energy: 12,347 kWh (automatically updated!)
 * 
 * Zero Button (ID 200):
 * - Press to sync with current Shelly reading
 * - Sets Meter Start Value = current Shelly total
 * - Offset becomes 0
 * 
 * Note: Button ID 200 doesn't conflict with Number ID 200
 * (Shelly uses button:200 and number:200 as different components)
 */

let CONFIG = {
  updateInterval: 10000,  // Update every 10 seconds
  
  // EM component IDs (Pro EM has two energy meters)
  emIds: {
    channel1: 0,  // First energy meter (em1data:0)
    channel2: 1   // Second energy meter (em1data:1)
  },
  
  // Virtual component IDs
  virtualIds: {
    meterStartValue: 200,    // Number component - User enters utility meter reading (kWh)
    meterTotalEnergy: 201,   // Number component - Shows adjusted total (kWh)
    zeroButton: 200          // Button component - Sync to current Shelly
  }
};

// State tracking - stores fixed offset
let STATE = {
  lastMeterStart: null,    // Last known Meter Start Value
  fixedOffset: 0           // Fixed offset (only changes when Meter Start changes)
};

// Get meter start value from virtual number component
function getMeterStartValue() {
  let result = Shelly.getComponentStatus("number:" + JSON.stringify(CONFIG.virtualIds.meterStartValue));
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

// Zero function - sync to current Shelly reading
function syncToShelly() {
  print("Zero button pressed - syncing to current Shelly reading...");
  
  // Get energy from both channels
  getEMEnergy(CONFIG.emIds.channel1, function(energyCh1) {
    getEMEnergy(CONFIG.emIds.channel2, function(energyCh2) {
      
      // Calculate total
      let shellyTotal = energyCh1 + energyCh2;
      
      // Set meter start value to match Shelly total
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.meterStartValue,
        value: shellyTotal
      });
      
      // Set meter total energy to match Shelly (offset = 0)
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.meterTotalEnergy,
        value: shellyTotal
      });
      
      // Update state
      STATE.lastMeterStart = shellyTotal;
      STATE.fixedOffset = 0;
      
      print("Synced to Shelly:", shellyTotal, "kWh");
      print("Offset set to: 0 kWh");
    });
  });
}

// Update meter total energy
function updateMeterTotal() {
  // Get energy from both channels
  getEMEnergy(CONFIG.emIds.channel1, function(energyCh1) {
    getEMEnergy(CONFIG.emIds.channel2, function(energyCh2) {
      
      // Calculate Shelly total (both channels)
      let shellyTotal = energyCh1 + energyCh2;
      
      // Get user's meter start value (in kWh)
      let meterStart = getMeterStartValue();
      
      // Check if Meter Start Value has changed
      if (STATE.lastMeterStart === null || meterStart !== STATE.lastMeterStart) {
        // Meter Start Value changed! Calculate new fixed offset
        STATE.fixedOffset = meterStart - shellyTotal;
        STATE.lastMeterStart = meterStart;
        
        print("Meter Start Value changed to:", meterStart, "kWh");
        print("Shelly Total:", shellyTotal, "kWh");
        print("New Fixed Offset:", STATE.fixedOffset, "kWh");
      }
      
      // Calculate meter total energy using fixed offset
      let meterTotalEnergy = shellyTotal + STATE.fixedOffset;
      
      // Update meter total energy component
      Shelly.call("Number.Set", {
        id: CONFIG.virtualIds.meterTotalEnergy,
        value: meterTotalEnergy
      });
      
      // Optional: Print to console for debugging
      // print("Meter Total:", meterTotalEnergy, "kWh (Shelly:", shellyTotal, "+ Offset:", STATE.fixedOffset, ")");
    });
  });
}

// Start periodic updates
Timer.set(CONFIG.updateInterval, true, function() {
  updateMeterTotal();
});

// Do an immediate first update
updateMeterTotal();

// Listen for button press events
Shelly.addEventHandler(function(event) {
  if (event.component === "button:" + CONFIG.virtualIds.zeroButton && event.info.event === "single_push") {
    syncToShelly();
  }
});

print("Shelly Pro EM Meter Synchronization Script started!");
print("Update interval:", CONFIG.updateInterval, "ms");
print("");
print("Virtual components:");
print("  - Number 200: Meter Start Value (enter your utility meter reading)");
print("  - Number 201: Meter Total Energy (shows synchronized total)");
print("  - Button 200: Zero (optional - sync to current Shelly)");
print("");
print("How it works:");
print("  1. Enter your utility meter reading in component 200");
print("  2. Offset calculated once and stored internally");
print("  3. Component 201 shows: Shelly Total + Fixed Offset");
print("  4. Offset only changes when you change component 200");
print("");
print("To set meter start value via HTTP:");
print("  http://YOUR_IP/rpc/Number.Set?id=200&value=VALUE");
print("(VALUE in kWh, both dot and comma decimals supported)");
