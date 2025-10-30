# Shelly Pro EM Energy Offset Script

A powerful script for the Shelly Pro EM that allows you to add custom offsets to energy readings and track consumption over specific periods with a convenient zero button.

## Features

✨ **Custom Energy Offsets** - Add or subtract values from each channel and total energy readings  
📊 **Home Assistant Integration** - Full history tracking with number entities  
🔄 **Zero Button** - Instantly reset displays to monitor specific time periods  
⚡ **Real-time Updates** - Values update every 10 seconds  
🎯 **Per-Channel Control** - Independent offsets for Channel 1, Channel 2, and Total  
📈 **Automatic Totaling** - Automatically calculates combined energy from both channels

## Use Cases

- **Utility Meter Alignment** - Match your Shelly readings to your utility company's meter
- **Period Monitoring** - Track consumption for specific events, days, or billing cycles
- **Split Monitoring** - Track two separate circuits independently (e.g., house vs. garage)
- **Solar Integration** - Monitor production and consumption separately
- **Tenant Billing** - Set starting values for new tenants
- **Migration** - Transfer readings from an old energy monitor

## Quick Start

### Prerequisites

- Shelly Pro EM with updated firmware
- Access to Shelly web interface at `http://YOUR_SHELLY_IP`

### Installation

#### Step 1: Create Virtual Components

Navigate to **Settings → Virtual Components** in your Shelly web interface.

**Create 3 Number Components for Display:**

| ID  | Name                   | Unit | Min        | Max       |
|-----|------------------------|------|------------|-----------|
| 200 | Channel 1 Total Energy | kWh  | -999999999 | 999999999 |
| 201 | Channel 2 Total Energy | kWh  | -999999999 | 999999999 |
| 202 | Total Energy           | kWh  | -999999999 | 999999999 |

**Create 3 Number Components for Offsets:**

| ID  | Name             | Unit | Min        | Max       |
|-----|------------------|------|------------|-----------|
| 203 | Channel 1 Offset | kWh  | -999999999 | 999999999 |
| 204 | Channel 2 Offset | kWh  | -999999999 | 999999999 |
| 205 | Total Offset     | kWh  | -999999999 | 999999999 |

**Create 1 Button Component:**

| ID  | Name                 |
|-----|----------------------|
| 200 | Zero Energy Displays |

> **Important:** Click **Save** after adding each component!

#### Step 2: Install the Script

1. Navigate to **Settings → Scripts**
2. Click **+ Add Script**
3. Name it (e.g., "Energy Offset")
4. Copy and paste the contents of `shelly_pro_em_energy_offset.js`
5. Click **Save**
6. Click **Start** to run the script

#### Step 3: Verify Operation

1. Return to **Settings → Virtual Components**
2. The 3 display components should show current energy values in kWh
3. The 3 offset components should be set to 0 by default
4. The "Zero Energy Displays" button should be visible

## How It Works

The script performs calculations every 10 seconds:

```
Channel 1 Display (kWh) = (API Ch1 Energy (Wh) ÷ 1000) + Channel 1 Offset (kWh)
Channel 2 Display (kWh) = (API Ch2 Energy (Wh) ÷ 1000) + Channel 2 Offset (kWh)
Total Display (kWh) = (API Ch1 + API Ch2) (Wh) ÷ 1000 + Total Offset (kWh)
```

**Important:** Total uses RAW API values from both channels, NOT the adjusted display values!

**Example:**
- Channel 1 API: 5,000,000 Wh = 5,000 kWh
- Channel 1 Offset: +2,500 kWh
- **Channel 1 Display: 7,500 kWh**

- Channel 2 API: 3,000,000 Wh = 3,000 kWh
- Channel 2 Offset: +1,000 kWh
- **Channel 2 Display: 4,000 kWh**

- Total API: 5,000 + 3,000 = 8,000 kWh (raw values!)
- Total Offset: +500 kWh
- **Total Display: 8,500 kWh**

## Using the Zero Button

The zero button instantly resets all energy displays to 0.000 kWh, making it perfect for monitoring consumption over specific periods.

### How It Works

When pressed, the button:
1. Reads current energy values from both channels
2. Sets each offset to the negative of the current value
3. Results in all displays showing 0.000 kWh

**Important:** Your actual energy data is never deleted - the button simply adjusts offsets!

### Usage Methods

**Via Web Interface:**
1. Go to **Settings → Virtual Components**
2. Find "Zero Energy Displays" button
3. Click it
4. Wait 10 seconds - displays now show 0.000 kWh

**Via HTTP API:**
```bash
curl -X POST "http://YOUR_SHELLY_IP/rpc/Button.Trigger?id=200"
```

**Via Home Assistant:**

The button appears as: `button.shelly_pro_em_XXXXXX_zero_energy_displays`

Use in automations:
```yaml
service: button.press
target:
  entity_id: button.shelly_pro_em_XXXXXX_zero_energy_displays
```

### Use Case Examples

📅 **Daily Tracking**  
Press the button every morning to see daily consumption by evening

📊 **Circuit Comparison**  
Zero displays, then compare which circuit uses more energy

🎉 **Event Tracking**  
Press before a party, see exactly how much energy the event consumed

🔌 **Appliance Testing**  
Zero before turning on an appliance, measure its exact consumption

⚡ **Split Load Analysis**  
Monitor main house (Ch1) vs. outbuilding (Ch2) separately

## Setting Offsets

Offsets allow you to adjust displayed values to match utility meters or set custom starting points.

### Via Web Interface

1. Navigate to **Settings → Virtual Components**
2. Find the offset you want to modify
3. Enter a value in kilowatt-hours (kWh)
   - Positive values increase the display
   - Negative values decrease the display
4. The display updates within 10 seconds

**Examples:**
- Enter `5` to add 5 kWh to the display
- Enter `-2.5` to subtract 2.5 kWh from the display

### Via HTTP API

```bash
# Set Channel 1 offset to 5 kWh
curl "http://YOUR_SHELLY_IP/rpc/Number.Set?id=203&value=5"

# Set Channel 2 offset to -2.5 kWh
curl "http://YOUR_SHELLY_IP/rpc/Number.Set?id=204&value=-2.5"

# Set Total offset to 100 kWh
curl "http://YOUR_SHELLY_IP/rpc/Number.Set?id=205&value=100"
```

### Understanding the Total Offset

The Total Offset is applied to the sum of **RAW API values** (not adjusted channel displays). This is useful for:
- Adding a baseline to the combined total
- Matching utility meter readings
- Compensating for external factors affecting both channels

**Example:**
- Channel 1 API: 1,000 kWh (raw) + 500 offset = **1,500 kWh display**
- Channel 2 API: 2,000 kWh (raw) + 300 offset = **2,300 kWh display**
- Raw Total: 1,000 + 2,000 = 3,000 kWh (uses raw API values!)
- Total Offset: +1,000 kWh
- **Final Total Display: 4,000 kWh**

Notice: Total (4,000) ≠ Ch1 display (1,500) + Ch2 display (2,300) = 3,800  
This is intentional! Total uses raw API values, not adjusted displays.

### Calculating Offsets

To match a utility meter reading:

**Example:** Your utility meter shows 12,345 kWh, but Shelly total shows 5,000 kWh

```
Total Offset = Utility Reading - Shelly Total
Total Offset = 12,345 - 5,000 = 7,345 kWh
```

Set the Total Offset to `7345` kWh.

## Home Assistant Integration

Once added to Home Assistant, the script creates 7 entities automatically:

### Display Entities (Read-Only)
- `number.shelly_pro_em_XXXXXX_channel_1_total_energy` 
- `number.shelly_pro_em_XXXXXX_channel_2_total_energy` 
- `number.shelly_pro_em_XXXXXX_total_energy` 

### Offset Entities (Adjustable)
- `number.shelly_pro_em_XXXXXX_channel_1_offset` 
- `number.shelly_pro_em_XXXXXX_channel_2_offset` 
- `number.shelly_pro_em_XXXXXX_total_offset` 

### Button Entity
- `button.shelly_pro_em_XXXXXX_zero_energy_displays`

### Dashboard Example

Add to your Home Assistant dashboard:

```yaml
type: entities
title: Energy Monitoring
entities:
  - entity: number.shelly_pro_em_XXXXXX_channel_1_total_energy
    name: Channel 1 Energy
  - entity: number.shelly_pro_em_XXXXXX_channel_2_total_energy
    name: Channel 2 Energy
  - type: divider
  - entity: number.shelly_pro_em_XXXXXX_total_energy
    name: Total Energy
  - type: divider
  - entity: button.shelly_pro_em_XXXXXX_zero_energy_displays
    name: Reset to Zero
```

### Automation Examples

**Automatic Daily Reset:**
```yaml
automation:
  - alias: "Reset Energy Displays Daily"
    trigger:
      platform: time
      at: "00:00:00"
    action:
      service: button.press
      target:
        entity_id: button.shelly_pro_em_XXXXXX_zero_energy_displays
```

**Set Offset to Match Utility Meter:**
```yaml
automation:
  - alias: "Sync with Utility Meter"
    trigger:
      platform: time
      at: "06:00:00"
    action:
      service: number.set_value
      target:
        entity_id: number.shelly_pro_em_XXXXXX_total_offset
      data:
        value: 12345  # Your utility meter reading
```

**Alert When Channel 1 Exceeds Threshold:**
```yaml
automation:
  - alias: "High Energy Alert - Channel 1"
    trigger:
      platform: numeric_state
      entity_id: number.shelly_pro_em_XXXXXX_channel_1_total_energy
      above: 100
    action:
      service: notify.mobile_app
      data:
        message: "Channel 1 has used over 100 kWh!"
```

### Energy Dashboard Integration

All number entities have the proper `device_class: energy` and `state_class: total_increasing`, making them compatible with Home Assistant's Energy Dashboard:

1. Go to **Settings → Dashboards → Energy**
2. Click **Add Consumption**
3. Select your preferred entity (e.g., `number.shelly_pro_em_XXXXXX_total_energy`)
4. Configure time period and start tracking!

You can add both channels separately to compare their consumption in the Energy Dashboard.

## Troubleshooting

### Script Won't Start

**Symptoms:** Script shows error or won't start

**Solutions:**
- Verify all 7 virtual components are created (IDs: 200-202, 203-205, 200 button)
- Check that component IDs match exactly
- Ensure firmware is up to date
- Restart the Shelly device

### Energy Values Not Showing

**Symptoms:** Display components show 0 or no value

**Solutions:**
- Wait 10 seconds for the first update cycle
- Check the script log for errors (Settings → Scripts → View Log)
- Verify the Pro EM is measuring energy (check API: `http://YOUR_IP/rpc/EM1Data.GetStatus?id=0`)
- Confirm script is running (should show "Running" status)

### Zero Button Not Working

**Symptoms:** Clicking button doesn't reset displays

**Solutions:**
- Verify button component ID is 200
- Check script log after pressing button
- Wait 10 seconds for update cycle
- Ensure script is running

### Home Assistant Entities Not Appearing

**Symptoms:** Entities don't show up in Home Assistant

**Solutions:**
- Reload the Shelly integration (Settings → Devices & Services)
- Wait 2-3 minutes for entity discovery
- Check the entity registry (Settings → Devices & Services → Shelly → Device)
- Verify Shelly firmware is up to date

### Values Seem Incorrect

**Symptoms:** Displayed values don't match expectations

**Solutions:**
- Check offsets are set correctly (Settings → Virtual Components)
- Verify Shelly is measuring correctly via API
- Confirm you're using kWh (not Wh) for offset values
- Understand that Total = (Channel 1 + Channel 2) + Total Offset

### Total Doesn't Match Channel Sum

**Symptoms:** Total isn't the sum of Channel 1 and Channel 2 displays

**Solution:** This is correct behavior! Total uses RAW API values, not adjusted displays.
- Total = (Raw Ch1 + Raw Ch2) + Total Offset
- NOT (Adjusted Ch1 + Adjusted Ch2) + Total Offset

## Common Scenarios

### Scenario 1: Match Utility Meter

Your utility meter shows 15,234.5 kWh, but Shelly total shows 234.5 kWh.

**Solution:**
```
Total Offset = 15,234.5 - 234.5 = 15,000 kWh
```
Set Total Offset to `15000` kWh.

### Scenario 2: Start Fresh Each Month

You want to track monthly consumption from zero.

**Solution:**
- Press the Zero button on the 1st of each month
- Or create a Home Assistant automation to do it automatically

### Scenario 3: Monitor Two Circuits Separately

You have house power on Channel 1 and garage on Channel 2.

**Solution:**
- Set individual offsets for each channel if needed
- Monitor each channel's display separately
- Use Total to see combined consumption

### Scenario 4: Solar Production on Channel 2

Channel 1 monitors consumption, Channel 2 monitors solar production.

**Solution:**
- Use Channel 1 for consumption tracking
- Use Channel 2 for production tracking
- Use negative Total Offset to show net consumption

### Scenario 5: Party Consumption

You're hosting a party and want to see exactly how much energy it uses.

**Solution:**
1. Press Zero button before guests arrive
2. Check Total Energy after party ends
3. That's your party's energy consumption!

## API Reference

### Get Current Energy Values

```bash
# Get Channel 1 energy
curl "http://YOUR_SHELLY_IP/rpc/EM1Data.GetStatus?id=0"

# Get Channel 2 energy
curl "http://YOUR_SHELLY_IP/rpc/EM1Data.GetStatus?id=1"
```

Returns energy values in Wh (Watt-hours).

### Get Display Values

```bash
# Get Channel 1 display value
curl "http://YOUR_SHELLY_IP/rpc/Number.GetStatus?id=200"

# Get Channel 2 display value
curl "http://YOUR_SHELLY_IP/rpc/Number.GetStatus?id=201"

# Get Total display value
curl "http://YOUR_SHELLY_IP/rpc/Number.GetStatus?id=202"
```

### Set Offsets

```bash
# Set Channel 1 offset
curl "http://YOUR_SHELLY_IP/rpc/Number.Set?id=203&value=OFFSET_IN_KWH"

# Set Channel 2 offset
curl "http://YOUR_SHELLY_IP/rpc/Number.Set?id=204&value=OFFSET_IN_KWH"

# Set Total offset
curl "http://YOUR_SHELLY_IP/rpc/Number.Set?id=205&value=OFFSET_IN_KWH"
```

### Trigger Zero Button

```bash
curl -X POST "http://YOUR_SHELLY_IP/rpc/Button.Trigger?id=200"
```

## Technical Details

**Update Interval:** 10 seconds  
**Component IDs:**
- Display: 200-202 (Number components, kWh)
- Offsets: 203-205 (Number components, kWh)
- Zero Button: 200 (Button component)

**Calculation:**
```javascript
Channel 1 Display (kWh) = (API Energy (Wh) ÷ 1000) + Channel 1 Offset (kWh)
Channel 2 Display (kWh) = (API Energy (Wh) ÷ 1000) + Channel 2 Offset (kWh)
Total Display (kWh) = Channel 1 Display + Channel 2 Display + Total Offset (kWh)
```

**Data Persistence:**
- Offsets are stored in Shelly's virtual components
- Survive reboots and script restarts
- Can be backed up via Shelly configuration export

## Device Compatibility

This script is designed for:
- **Shelly Pro EM** (2-channel energy meter, 50A per channel)

For other Shelly energy monitoring devices, see:
- **Shelly Pro 3EM** (3-phase energy meter) - use the Pro 3EM version of this script
- **Shelly EM** (older model) - may require modifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - Feel free to use and modify as needed.

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review the script log (Settings → Scripts → View Log)
3. Open an issue on GitHub with:
   - Shelly firmware version
   - Script log output
   - Description of the problem

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

**Made with ❤️ for the Shelly community**

## Related Projects

- [Shelly Pro 3EM Energy Offset Script](../shelly-pro-3em-energy-offset) - For 3-phase monitoring
