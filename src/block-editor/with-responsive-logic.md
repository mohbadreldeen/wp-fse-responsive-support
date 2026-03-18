Mental Model

Source of truth is responsiveStyles per device, not the live block attributes.
Live block attributes are only the currently active device view.
The component continuously syncs between those two worlds.
Workflow In Order

Setup and guards:
The target list is filtered first in with-responsive-logic.tsx:9, and early return happens when no targets exist in with-responsive-logic.tsx:160.
Device resolution:
Current editor device is normalized to lowercase in with-responsive-logic.tsx:173.
Initial mount sync:
First effect in with-responsive-logic.tsx:180 does:
If desktop value exists in responsiveStyles, apply it into live attrs.
If desktop value is missing, seed it from current live attrs.
Device switch sync:
Second effect in with-responsive-logic.tsx:229 does:
Save current live attrs into previous device bucket.
Load current device bucket into live attrs.
User edits interception:
Wrapper setAttributes in with-responsive-logic.tsx:281 captures incoming edits and stores them to current device via setResponsiveValue.
Recursion protection:
Internal programmatic updates bypass interception when isSyncingRef is true in with-responsive-logic.tsx:282.
Where Complexity Comes From

setResponsiveValue both writes values and runs normalization adapters in with-responsive-logic.tsx:96.
Two effects plus one intercepted setter all call the same write path, so control flow is distributed.
There is write-time alias cleanup via adapter registry:
registry class in with-responsive-logic.tsx:26
conflict map in with-responsive-logic.tsx:39
adapter registration in with-responsive-logic.tsx:67
Debug Strategy That Works

Track one target path only, for example style.color.text, and ignore others.
Add grouped logs around three events only:
mount effect enter/exit
device effect enter/exit
interceptedSetAttributes enter/exit
Log exactly these fields each time:
device
previousDevice
target.path
live value before
responsiveStyles[device][encodedPath]
Confirm isSyncingRef transitions around setAttributes calls; this is the key to understanding loops.
Reproduce with one scenario:
open desktop
change value
switch to tablet
change value
switch back desktop
and verify storage and hydration each step.
