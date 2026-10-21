Checks before ordering, in steps. Refs are to `hardware/datasheets/`.
- [x] **1. LDO and 3V3**
	- [x] **MCU fed above its maximum** — fix: a 3.3 V LDO.
	- [x] **Checked**
- [ ] **2. Charger**
	- [x] **VBUS over the rating** — R10 = 2.2 kΩ.
	- [ ] **LED\_EN floats** — add a pull-down.
	- [ ] **Checked**
```c
  int x = 1;  // two spaces stay
```
## History
- **Oct 16** — Found in a check; approved within the \$560 ceiling.
