Checks before ordering, in steps. Refs are to <code>hardware/datasheets/</code>.

- [x] <b>1. LDO and 3V3</b>
  - [x] <b>MCU fed above its maximum</b> — fix: a 3.3 V LDO.
  - [x] <b>Checked</b>
- [ ] <b>2. Charger</b>
  - [x] <b>VBUS over the rating</b> — R10 = 2.2 kΩ.
  - [ ] <b>LED\_EN floats</b> — add a pull-down.
  - [ ] <b>Checked</b>

```c
  int x = 1;  // two spaces stay
```

## History

- <b>Oct 16</b> — Found in a check; approved within the \$560 ceiling.
