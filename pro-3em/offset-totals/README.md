# Shelly Energy Meter Synchronization - Simple Version

A simplified script that synchronizes your Shelly energy readings with your utility meter.

## What It Does

You enter your utility meter reading → Script calculates offset once → Displays synchronized total that updates automatically!

**Only 2 components needed:**
1. **Meter Start Value** - You enter your utility meter reading here
2. **Meter Total Energy** - Shows synchronized total (updates every 10s)

## Use Cases

- Match Shelly readings to your utility meter
- Track consumption from a known starting point
- Monitor specific time periods (press zero, track until next zero)
- Simple setup without complex offset management

## Quick Setup

### Step 1: Create Virtual Components

Navigate to **Settings → Virtual Components** in your Shelly web interface.

**Create Number Component for Input:**

| ID  | Name             | Unit | Min   | Max       | Type  |
|-----|------------------|------|-------|-----------|-------|
| 200 | Meter Start Value| kWh  | 0     | 999999999 | Field |

**Create Number Component for Display:**

| ID  | Name              | Unit | Min   | Max       | Type  |
|-----|-------------------|------|-------|-----------|-------|
| 201 | Meter Total Energy| kWh  | 0     | 999999999 | Label |

**Optional - Create Button Component:**

| ID  | Name  |
|-----|-------|
| 200 | Zero  |

> **Note:** Button ID 200 doesn't conflict with Number ID 200 (different component types)

### Step 2: Install the Script

1. Navigate to **Settings → Scripts**
2. Click **+ Add Script**
3. Name it (e.g., "Meter Sync")
4. **For Pro 3EM:** Copy contents of `shelly_pro_3em_simple_offset.js`
5. **For Pro EM:** Copy contents of `shelly_pro_em_simple_offset.js`
6. Click **Save**
7. Click **Start** to run the script

### Step 3: Enter Your Meter Reading

1. Go to **Settings → Virtual Components**
2. Find "Meter Start Value" (ID 200)
3. Enter your utility meter reading in kWh
4. Wait 10 seconds - "Meter Total Energy" will match your input!

## How It Works

**The Magic:**
1. You enter your meter reading once
2. Script calculates offset = (your reading - current Shelly)
3. Offset is stored internally (you never see it)
4. Every 10s: Meter Total = Current Shelly + Fixed Offset

**Example:**

**Day 1 - You enter 12,345 kWh:**
```
Meter Start Value: 12,345 kWh (you enter)
Shelly Total: 5,000 kWh (from API)
Offset calculated: 7,345 kWh (stored internally)

Meter Total Energy: 12,345 kWh ✓ (matches your input!)
```

**Hours later - Energy consumed:**
```
Meter Start Value: 12,345 kWh (unchanged)
Shelly Total: 5,002 kWh (increased!)
Offset: 7,345 kWh (STILL FIXED!)

Meter Total Energy: 12,347 kWh ✓ (auto-updated!)
```

**Month later - You update:**
```
Meter Start Value: 12,400 kWh (new reading)
Shelly Total: 5,055 kWh
Offset recalculated: 7,345 kWh (new fixed value)

Meter Total Energy: 12,400 kWh ✓ (matches new input!)
```

**Key Behavior:**
- ✅ Offset calculated ONCE when you enter a value
- ✅ Offset stays fixed (doesn't drift)
- ✅ Meter Total Energy updates every 10s automatically
- ✅ Only recalculates when YOU change Meter Start Value

## Using the Zero Button

Press the Zero button to sync to current Shelly reading:

**What it does:**
1. Gets current Shelly total (e.g., 5,002 kWh)
2. Sets Meter Start Value = 5,002 kWh
3. Sets Meter Total Energy = 5,002 kWh
4. Offset becomes 0

**Perfect for:**
- Starting fresh tracking
- Monitoring daily consumption (press every morning)
- Tracking specific events (press before, check after)

## Home Assistant Integration

After adding Shelly to Home Assistant, you'll see:

**Entities:**
- `number.shelly_pro_xxx_meter_start_value` - Editable input
- `number.shelly_pro_xxx_meter_total_energy` - Auto-updating display
- `button.shelly_pro_xxx_zero` - Reset button

### Dashboard Example

```yaml
type: entities
title: Energy Monitoring
entities:
  - entity: number.shelly_pro_xxx_meter_total_energy
    name: "Total Energy"
    icon: mdi:lightning-bolt
  - entity: number.shelly_pro_xxx_meter_start_value
    name: "Meter Reading"
  - entity: button.shelly_pro_xxx_zero
    name: "Reset"
```

### Use Meter Total Energy Directly

The best part? **No templates needed!**

```yaml
sensor:
  - platform: template
    sensors:
      monthly_consumption:
        friendly_name: "This Month"
        unit_of_measurement: "kWh"
        value_template: >
          {{ states('number.shelly_pro_xxx_meter_total_energy') | float }}
```

Or add directly to Energy Dashboard:
1. Settings → Dashboards → Energy
2. Add individual devices
3. Select `number.shelly_pro_xxx_meter_total_energy`
4. Done!

### Automation Examples

**Monthly Meter Update:**
```yaml
automation:
  - alias: "Update Meter Reading"
    trigger:
      platform: time
      at: "00:00:00"
    condition:
      - condition: template
        value_template: "{{ now().day == 1 }}"
    action:
      - service: number.set_value
        target:
          entity_id: number.shelly_pro_xxx_meter_start_value
        data:
          value: 12345  # Your utility meter reading
```

**Daily Reset:**
```yaml
automation:
  - alias: "Reset Energy Daily"
    trigger:
      platform: time
      at: "00:00:00"
    action:
      - service: button.press
        target:
          entity_id: button.shelly_pro_xxx_zero
```

## API Usage

### Set Meter Start Value
```bash
curl "http://YOUR_IP/rpc/Number.Set?id=200&value=12345"
```

### Get Meter Total Energy
```bash
curl "http://YOUR_IP/rpc/Number.GetStatus?id=201"
```

### Trigger Zero Button
```bash
curl -X POST "http://YOUR_IP/rpc/Button.Trigger?id=200"
```

## Troubleshooting

### Meter Total doesn't match Start Value

**Immediately after entering:**
- Wait 10 seconds for first update
- Check script is running

### Values not updating

**Check:**
- Script status is "Running"
- Both components exist (200, 201)
- Shelly is measuring energy

### Can't edit Meter Start Value

**Solution:**
- Verify component 200 Type is "Field" (not Label)
- Recreate with correct type

## Comparison with Full Version

| Feature | Simple (2 components) | Full (7-9 components) |
|---------|----------------------|----------------------|
| **Setup** | 2 minutes | 10 minutes |
| **Components** | 2 + optional button | 7-9 |
| **What you see** | Synchronized total | Adjusted per-phase values |
| **Offset visible** | No (internal) | Yes (editable) |
| **Best for** | Simple sync | Advanced control |

## Common Scenarios

### Scenario 1: New Installation

```
Day 1: Utility meter shows 10,000 kWh
       Enter 10000 → Meter Total = 10,000 kWh

Week 1: Meter Total = 10,050 kWh (50 kWh used)
Month 1: Meter Total = 10,200 kWh (200 kWh used)
```

### Scenario 2: Midmonth Correction

```
You notice utility bill shows 12,500 kWh
But Meter Total shows 12,450 kWh (50 kWh drift!)

Just enter 12500 in Meter Start Value
Meter Total immediately shows 12,500 kWh ✓
Continues tracking from there
```

### Scenario 3: Daily Monitoring

```
Monday 00:00: Press Zero button
              Meter Total = 0.000 kWh

Monday 23:59: Meter Total = 15.234 kWh
              (Your daily consumption!)

Tuesday 00:00: Press Zero again
               Start fresh!
```

## Technical Details

**Update Interval:** 10 seconds  
**Storage:** Offset stored in script STATE (survives script restart)  
**Precision:** Full floating point (e.g., 12,345.678 kWh)  
**Compatible:** Pro 3EM and Pro EM

**Formula:**
```javascript
offset = meterStartValue - shellyTotal  // Calculated once
meterTotalEnergy = shellyTotal + offset // Updated every 10s
```

## Success Checklist

- ✅ 2 number components created (200, 201)
- ✅ Script installed and running
- ✅ Meter Start Value entered
- ✅ Meter Total Energy matches your input
- ✅ Values update automatically every 10s
- ✅ Offset stays fixed until you change input

---

**Perfect for:** Simple, no-fuss meter synchronization!

For advanced per-phase control, see the Full Version scripts.
