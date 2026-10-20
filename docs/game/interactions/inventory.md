# game_inventory

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Item provenance, deterministic loot, transfer rules, and container UI. Current inventory is party-wide; Pella and Tavi require distinct consumed fitting items. Equipment effects, locks, and traps are not implemented. The richer container state machine and item-use APIs below are extension contracts; generated filenames and runtime operations must follow the live catalogs.

## Items, inventories, and containers

### Item types

Create `item-types.json` from legacy object classes actually referenced by the saved party, baked loot, and mission rewards.

```json
{
  "id": "MinorHealingPotion",
  "name": "Minor Healing Potion",
  "icon": "potion/minorheal.png",
  "stackable": false,
  "maxUses": 1,
  "tags": ["potion", "healing"],
  "legacyClass": "org.jcrpg.world.object.magical.potion.MinorHealingPotion"
}
```

Do not attempt to port the full combat effect system as a prerequisite for loot. Items can exist in inventory before every use effect is implemented; unimplemented uses must be labeled and disabled.

### Inventory scope

For the first interaction vertical slice, use a party-wide inventory while preserving optional `ownerActorId` on imported objects. This avoids blocking missions on per-character equipment UI. Later migration can distribute instances to individual party members without changing item IDs.

Inventory operations must be pure and testable:

- `has(typeId, count)`;

- `grant(instance)`;

- `remove(instanceId)`;

- `consume(typeId, count)`;

- `transfer(containerId, instanceIds)`;

- `listByTag(tag)`.

### Concrete baked chest contents

Create one `ContainerDefinition` per generated chest:

```json
{
  "id": "populationGreekMazeHorde#22:structure:0:chest:220",
  "kind": "chest",
  "position": [24.5, 39, 854.5],
  "ownerStructureId": "populationGreekMazeHorde#22:structure:0",
  "lock": null,
  "trap": null,
  "items": [
    {
      "id": "item:populationGreekMazeHorde#22:structure:0:chest:220:000",
      "typeId": "MinorHealingPotion",
      "quantity": 1
    }
  ],
  "missionBindings": []
}
```

Bake concrete item instances offline. Do not roll loot when the chest opens; that would make saves and compiler changes difficult to reconcile.

Loot allocation rules:

- seed from stable container ID and interaction-content version;

- reserve mission-critical items before filling ordinary loot;

- never place a required item in a container gated by that same item;

- cap items per chest and total world items;

- validate item type references and unique item instance IDs;

- permit empty chests only when deliberately marked;

- treat crates, barrels, and baskets as decoration in the first slice unless explicit container definitions are emitted.

### Container state

Use explicit states:

```text
unseen -> inspected -> unlocked -> opened -> looted
                      \-> forced
```

Lock/trap gameplay is a later subphase but the schema should reserve:

- lock type and level;

- trap type and level;

- identified/disarmed/forced flags;

- deterministic resolution seed;

- failure consequences.

The first release may set all locks/traps to `null`. Do not reproduce the legacy method's unconditional random trap placeholder as authoritative content.

### Container UI

Opening a chest should show:

- container name and state;

- item list with icons and quantities;

- Take and Take All actions;

- mission-item badge;

- close action;

- clear feedback when inventory transfer succeeds.

Taking items and advancing linked objectives occur in the same transaction.
