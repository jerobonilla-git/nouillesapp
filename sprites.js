// SPRITES: the ONE place that says which PNG file is used for what.
//
// To swap art: put your PNG in app/art/... with the name below.
// That's it. No other code changes needed.
//
// If a PNG is missing, the app shows a grey box of the right size instead.

const SPRITES = {
  "panel-row":         "art/ui/panel-row.png",          // 24x24, 9-slice, 8px borders
  "checkbox-empty":    "art/ui/checkbox-empty.png",     // 16x16
  "checkbox-ticked":   "art/ui/checkbox-ticked.png",    // 16x16
  "btn-add":           "art/ui/btn-add.png",            // 16x16
  "btn-add-pressed":   "art/ui/btn-add-pressed.png",    // 16x16
  "tile":              "art/backgrounds/tile.png",      // 16x16, repeats
  "tile-feature":      "art/ui/tile-feature.png",       // 24x24, 9-slice, home screen tile
  "tile-soon":         "art/ui/tile-soon.png",          // 24x24, 9-slice, greyed "coming soon" tile
};

// For each sprite, try to load the PNG.
// If it loads, we tell the CSS two things:
//   1. a variable like --img-btn-add holding the picture
//   2. a class like "art-btn-add" on <html>, meaning "the real art exists"
// The CSS uses that class to swap the grey box for the picture.
function loadSprites() {
  for (const name in SPRITES) {
    const img = new Image();
    img.onload = () => {
      const root = document.documentElement;
      root.style.setProperty("--img-" + name, `url("${SPRITES[name]}")`);
      root.classList.add("art-" + name);
    };
    // If it fails (file not drawn yet), we do nothing: the grey box stays.
    img.src = SPRITES[name];
  }
}

loadSprites();
