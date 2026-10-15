// SPRITES: the ONE place that says which PNG file is used for what.
//
// Each sprite has:
//   n     = its number (the red "(n)" badge you see on screen while it is a placeholder)
//   file  = where the PNG lives
//   size  = the size in pixels the PNG must have
//   where = where it shows up in the app          (only used for the legend)
//   draw  = what to draw                          (only used for the legend)
//
// art/ASSETS.md is GENERATED from this list. Never edit it by hand. After changing
// anything here, run:   python3 tools/make-assets.py
// (add --check to see whether ASSETS.md is up to date without changing it)
//
// To swap art: replace the PNG in app/art/... keeping the SAME name. That's it.
// No other code changes needed.
//
// Naming pattern: <screen>-<thing>-<state>.png
//
// Keep each value on one line, in "double quotes". Write \" for a quote inside text.

const SPRITES = {
  "home-background": {
    n: 1,
    file: "art/backgrounds/home-background.png",
    size: "32x32",
    where: "Behind every screen, repeated all over, shown at x2 (64px)",
    draw: "A seamless tile (edges must match when repeated). Keep it calm so text stays readable. Badge sits in the bottom-left of the screen.",
  },
  "home-tile-courses": {
    n: 2,
    file: "art/ui/home-tile-courses.png",
    size: "160x90",
    where: "Home screen: the picture for the \"Courses\" feature, shown at x2 (320x180). The word \"Courses\" is plain text under it, so do NOT draw the name in the art",
    draw: "The beautiful centerpiece picture of the feature. Fixed size, not stretched. Every main feature gets its own `home-tile-<feature>.png` at the same 160x90 (e.g. friends, plants).",
  },
  "home-tile-soon": {
    n: 3,
    file: "art/ui/home-tile-soon.png",
    size: "160x90",
    where: "Home screen: the stand-in tile under Courses, shown at x2 (320x180) with the word \"soon\" as plain text below. Not tappable",
    draw: "A picture for the next feature (a generic stand-in now). Same fixed 160x90 as the feature tiles. Do NOT draw the word in the art. When a real feature replaces it, it gets its own `home-tile-<feature>.png`.",
  },
  "courses-row-panel": {
    n: 4,
    file: "art/ui/courses-row-panel.png",
    size: "32x32",
    where: "Courses: behind every list item. Also behind the Undo bar",
    draw: "A 9-slice panel, 8px borders. Must stay readable with text on top.",
  },
  "courses-checkbox-empty": {
    n: 5,
    file: "art/ui/courses-checkbox-empty.png",
    size: "16x16",
    where: "Courses: left of each item, not ticked",
    draw: "An empty box.",
  },
  "courses-checkbox-ticked": {
    n: 6,
    file: "art/ui/courses-checkbox-ticked.png",
    size: "16x16",
    where: "Courses: the same box with a tick, visible for a split second while the item fades out",
    draw: "The same box as 5 with a check mark.",
  },
  "courses-add-button": {
    n: 7,
    file: "art/ui/courses-add-button.png",
    size: "16x16",
    where: "Courses: the big + at the bottom (shown x6). Also the small confirm button next to the text box (x3)",
    draw: "A button with a plus drawn inside it. It must look good big and small.",
  },
  "courses-add-button-pressed": {
    n: 8,
    file: "art/ui/courses-add-button-pressed.png",
    size: "16x16",
    where: "Same two buttons while your finger is down",
    draw: "Same as 7 but pressed in (darker, shifted down one pixel).",
  },
  "app-icon": {
    n: 9,
    file: "art/icons/app-icon.png",
    size: "32x32",
    where: "Home screen: left of the title \"NouillesApp\" (shown at 32px). Also the icon on the phone after \"Add to home screen\" (see the install icons note below)",
    draw: "The app icon.",
  },
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
