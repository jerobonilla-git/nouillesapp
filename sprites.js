// SPRITES: the ONE place that says which PNG file is used for what.
//
// Each sprite has:
//   n    = its number in art/ASSETS.md (the red "(n)" badge you see on screen)
//   file = where the PNG lives
//
// To swap art: replace the PNG in app/art/... keeping the SAME name. That's it.
// No other code changes needed.
//
// Naming pattern: <screen>-<thing>-<state>.png

const SPRITES = {
  "home-background":               { n: 1, file: "art/backgrounds/home-background.png" },               // 16x16, repeats
  "home-tile-courses":             { n: 2, file: "art/ui/home-tile-courses.png" },                      // 160x90 fixed picture (one per main feature)
  "home-tile-soon":                { n: 3, file: "art/ui/home-tile-soon.png" },                         // 160x90 fixed picture (stand-in for the next feature)
  "courses-row-panel":             { n: 4, file: "art/ui/courses-row-panel.png" },                      // 24x24, 9-slice
  "courses-checkbox-empty":        { n: 5, file: "art/ui/courses-checkbox-empty.png" },                 // 16x16
  "courses-checkbox-ticked":       { n: 6, file: "art/ui/courses-checkbox-ticked.png" },                // 16x16
  "courses-add-button":            { n: 7, file: "art/ui/courses-add-button.png" },                     // 16x16
  "courses-add-button-pressed":    { n: 8, file: "art/ui/courses-add-button-pressed.png" },             // 16x16
  "app-icon":                      { n: 9, file: "art/icons/app-icon.png" },                          // 32x32, next to the title on Home (and the phone's home screen icon)
};

// The placeholder PNGs are made with a known look: dark border pixel at the
// corner (40,40,40) and grey fill pixel in the middle (138,138,138).
// If a PNG still has that look, it is a placeholder, not real art yet.
function isPlaceholder(img) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const corner = ctx.getImageData(0, 0, 1, 1).data;
    const middle = ctx.getImageData(canvas.width >> 1, canvas.height >> 1, 1, 1).data;
    return corner[0] === 40 && corner[1] === 40 && corner[2] === 40 && corner[3] === 255 &&
           middle[0] === 138 && middle[1] === 138 && middle[2] === 138 && middle[3] === 255;
  } catch (e) {
    return false;   // can't read the pixels: treat it as real art
  }
}

// For each sprite we tell the CSS what happened, using classes on <html>:
//   "art-<name>" = a PNG file loaded, so show it (even a grey placeholder one)
//   "ph-<name>"  = still a placeholder (grey PNG, or no PNG at all): show the number badge
// We also give the CSS a variable "--num-<name>" holding the "(n)" text for the badge.
// And "--img-<name>" holding the picture itself.
function loadSprites() {
  const root = document.documentElement;
  for (const name in SPRITES) {
    const sprite = SPRITES[name];
    root.style.setProperty("--num-" + name, `"(${sprite.n})"`);

    const img = new Image();
    img.onload = () => {
      root.style.setProperty("--img-" + name, `url("${sprite.file}")`);
      root.classList.add("art-" + name);
      if (isPlaceholder(img)) root.classList.add("ph-" + name);
    };
    // No PNG at all: the CSS grey box stays, and it gets the badge too.
    img.onerror = () => root.classList.add("ph-" + name);
    img.src = sprite.file;
  }
}

loadSprites();
