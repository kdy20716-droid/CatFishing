/**
 * Custom Hand-Drawn Illustrated Vector Sprites for Baits
 */

export const BAIT_SVGS = {
  bread: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Toast / Bread Slice with Crust, Butter, and Crumbs -->
      <path d="M7 10 C7 6, 12 5, 16 5 C20 5, 25 6, 25 10 C26 15, 26 23, 24 26 C22 27, 10 27, 8 26 C6 23, 6 15, 7 10 Z" fill="#e9c46a" stroke="#8c5835" stroke-width="2"/>
      <path d="M9 11 C9 8, 13 7, 16 7 C19 7, 23 8, 23 11 C24 15, 24 22, 22 24 C20 25, 12 25, 10 24 C8 22, 8 15, 9 11 Z" fill="#fefae0"/>
      <!-- Butter cube melting -->
      <rect x="13" y="12" width="6" height="5" rx="1.5" fill="#ffe66d" stroke="#e7c169" stroke-width="1"/>
      <!-- Toasted specks & crumbs -->
      <circle cx="12" cy="20" r="0.9" fill="#bc6c25"/>
      <circle cx="19" cy="21" r="0.9" fill="#bc6c25"/>
      <circle cx="27" cy="24" r="1.2" fill="#e9c46a"/>
      <circle cx="28.5" cy="26" r="0.8" fill="#bc6c25"/>
    </svg>
  `,

  worm: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Wriggling Pink Earthworm with cute face & blush -->
      <path d="M6 24 Q10 28, 14 24 T22 20 Q26 16, 25 11 Q24 7, 20 7 Q16 8, 17 12 Q18 16, 13 18 T6 24 Z" fill="#ff758f" stroke="#c9184a" stroke-width="2"/>
      <!-- Worm segment stripes -->
      <path d="M11 23 Q13 25, 15 22" stroke="#ff4d6d" stroke-width="1.5" fill="none"/>
      <path d="M16 19 Q18 21, 20 18" stroke="#ff4d6d" stroke-width="1.5" fill="none"/>
      <!-- Head Cute Eye & Blush -->
      <circle cx="22" cy="10" r="1.5" fill="#212529"/>
      <circle cx="22.5" cy="9.5" r="0.6" fill="#ffffff"/>
      <circle cx="20" cy="12" r="1.5" fill="#ff4d6d" opacity="0.6"/>
    </svg>
  `,

  shrimp: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Curved Pink Ocean Shrimp with Whiskers -->
      <!-- Whiskers -->
      <path d="M22 10 Q28 6, 30 2" stroke="#ff758f" stroke-width="1.2" fill="none"/>
      <path d="M23 12 Q29 10, 31 7" stroke="#ff758f" stroke-width="1.2" fill="none"/>
      <!-- Body Curve -->
      <path d="M24 14 C24 8, 15 6, 10 11 C6 15, 6 22, 10 25 C12 26, 14 24, 13 22 C11 20, 11 16, 14 13 C17 10, 22 11, 24 14 Z" fill="#ff8fa3" stroke="#d90429" stroke-width="2"/>
      <!-- Segments -->
      <path d="M16 10 Q14 14, 16 17" stroke="#ff4d6d" stroke-width="1.5" fill="none"/>
      <path d="M12 13 Q10 17, 12 20" stroke="#ff4d6d" stroke-width="1.5" fill="none"/>
      <!-- Tail Fan -->
      <polygon points="10,25 4,28 7,24 4,21 10,23" fill="#ff4d6d" stroke="#d90429" stroke-width="1"/>
      <!-- Eye -->
      <circle cx="21" cy="11" r="1.5" fill="#212529"/>
      <circle cx="21.5" cy="10.5" r="0.6" fill="#ffffff"/>
    </svg>
  `,

  lure: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Glowing Bioluminescent Minnow Lure with Hook -->
      <defs>
        <linearGradient id="lureGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00f5d4"/>
          <stop offset="50%" stop-color="#00bbf9"/>
          <stop offset="100%" stop-color="#7209b7"/>
        </linearGradient>
      </defs>
      <!-- Glow aura -->
      <circle cx="16" cy="14" r="12" fill="rgba(0, 245, 212, 0.3)"/>
      <!-- Minnow Body -->
      <path d="M26 12 Q20 8, 12 11 Q6 14, 4 14 Q8 16, 14 17 Q20 18, 26 12 Z" fill="url(#lureGrad)" stroke="#0077b6" stroke-width="1.8"/>
      <!-- Holographic scales pattern -->
      <path d="M15 11 L13 16 M18 11 L16 16 M21 11 L19 15" stroke="rgba(255,255,255,0.75)" stroke-width="1.2"/>
      <!-- Eye -->
      <circle cx="23" cy="13" r="2.5" fill="#ffd166"/>
      <circle cx="23" cy="13" r="1.3" fill="#000000"/>
      <!-- Mini Treble Hook dangling -->
      <path d="M14 17 L14 22 Q12 24, 10 22 M14 22 Q16 24, 18 22" stroke="#6c757d" stroke-width="1.5" fill="none"/>
    </svg>
  `,

  golden: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Radiant Golden Royal Krill with Stardust -->
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff3b0"/>
          <stop offset="50%" stop-color="#ffd166"/>
          <stop offset="100%" stop-color="#f77f00"/>
        </linearGradient>
      </defs>
      <!-- Golden Star Shimmer background -->
      <circle cx="16" cy="16" r="13" fill="rgba(255, 209, 102, 0.4)"/>
      <!-- Sparkles -->
      <polygon points="26,6 27,9 30,10 27,11 26,14 25,11 22,10 25,9" fill="#ffbe0b"/>
      <polygon points="6,20 7,22 9,23 7,24 6,26 5,24 3,23 5,22" fill="#ffbe0b"/>
      <!-- Golden Shrimp/Krill Body -->
      <path d="M23 14 C23 9, 15 8, 11 12 C8 15, 8 21, 11 24 C13 25, 15 23, 14 21 C12 19, 12 16, 15 14 C18 12, 21 12, 23 14 Z" fill="url(#goldGrad)" stroke="#d48b00" stroke-width="2"/>
      <!-- Crown/Tiara on krill -->
      <polygon points="19,7 21,5 23,7 25,5 27,7 26,10 20,10" fill="#ffd166" stroke="#b25e00" stroke-width="1"/>
      <!-- Ruby Eye -->
      <circle cx="21" cy="12" r="1.5" fill="#d90429"/>
    </svg>
  `,

  rocket: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Fiery Cat Rocket Firecracker -->
      <defs>
        <linearGradient id="rocketGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff4d6d"/>
          <stop offset="100%" stop-color="#d90429"/>
        </linearGradient>
        <linearGradient id="flameGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffd166"/>
          <stop offset="50%" stop-color="#ff9e00"/>
          <stop offset="100%" stop-color="#ff0054"/>
        </linearGradient>
      </defs>
      <!-- Fire flame exhaust -->
      <polygon points="10,22 4,28 10,25 6,31 14,24" fill="url(#flameGrad)"/>
      <!-- Rocket Body Cylinder -->
      <path d="M12 22 L22 12 L26 16 L16 26 Z" fill="url(#rocketGrad)" stroke="#800f2f" stroke-width="1.5"/>
      <!-- Nose Cone -->
      <polygon points="22,12 28,6 26,16" fill="#ffd166" stroke="#b25e00" stroke-width="1.2"/>
      <!-- Fins -->
      <polygon points="12,22 8,24 10,18" fill="#00b4d8" stroke="#0077b6" stroke-width="1"/>
      <polygon points="16,26 18,30 22,28" fill="#00b4d8" stroke="#0077b6" stroke-width="1"/>
      <!-- Cat Face Stamp -->
      <circle cx="18" cy="18" r="2.2" fill="#fff"/>
      <circle cx="17.2" cy="17.5" r="0.5" fill="#212529"/>
      <circle cx="18.8" cy="17.5" r="0.5" fill="#212529"/>
    </svg>
  `,

  bomb: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Underwater Depth Charge Bomb with Skull & Fuse -->
      <defs>
        <radialGradient id="bombGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#495057"/>
          <stop offset="60%" stop-color="#212529"/>
          <stop offset="100%" stop-color="#0b090a"/>
        </radialGradient>
      </defs>
      <!-- Sparking Fuse -->
      <path d="M19 11 Q22 7, 25 8" stroke="#d4a373" stroke-width="2" fill="none"/>
      <!-- Spark fire -->
      <polygon points="26,6 28,8 31,7 28,10 29,13 26,11 23,12 25,9" fill="#ffbe0b"/>
      <circle cx="26" cy="9" r="1.5" fill="#ff0054"/>
      <!-- Bomb Sphere -->
      <circle cx="15" cy="19" r="11" fill="url(#bombGrad)" stroke="#161a1d" stroke-width="1.8"/>
      <!-- Highlight Reflection -->
      <ellipse cx="11" cy="15" rx="3.5" ry="2" fill="rgba(255,255,255,0.4)" transform="rotate(-30 11 15)"/>
      <!-- Yellow Hazard Bands -->
      <path d="M7 23 L23 15" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="3,3"/>
    </svg>
  `,

  multi_hook_2: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Double Hook Tackle Rig -->
      <!-- Main Line -->
      <line x1="16" y1="2" x2="16" y2="12" stroke="#adb5bd" stroke-width="1.5"/>
      <line x1="16" y1="12" x2="16" y2="22" stroke="#adb5bd" stroke-width="1.5"/>
      <!-- Swivels -->
      <circle cx="16" cy="12" r="2.5" fill="#ffd166" stroke="#b25e00" stroke-width="1"/>
      <circle cx="16" cy="22" r="2.5" fill="#ffd166" stroke="#b25e00" stroke-width="1"/>
      <!-- Hook 1 Branch (Right) -->
      <path d="M16 12 Q24 13, 24 17 Q24 21, 20 21" stroke="#6c757d" stroke-width="2" fill="none"/>
      <polygon points="20,19 18,21 21,23" fill="#6c757d"/>
      <!-- Hook 2 Branch (Bottom Left) -->
      <path d="M16 22 Q8 23, 8 27 Q8 31, 12 31" stroke="#6c757d" stroke-width="2" fill="none"/>
      <polygon points="12,29 14,31 11,33" fill="#6c757d"/>
    </svg>
  `,

  multi_hook_3: `
    <svg class="custom-bait-svg" viewBox="0 0 32 32" width="26" height="26">
      <!-- Triple Hook Tackle Rig (Trident Style) -->
      <!-- Center Main Line -->
      <line x1="16" y1="2" x2="16" y2="22" stroke="#adb5bd" stroke-width="1.5"/>
      <!-- Main Brass Swivel Rig -->
      <rect x="13" y="10" width="6" height="5" rx="1.5" fill="#ffd166" stroke="#b25e00" stroke-width="1"/>
      <!-- Left Hook -->
      <path d="M13 12 Q6 14, 6 18 Q6 22, 10 22" stroke="#495057" stroke-width="1.8" fill="none"/>
      <polygon points="10,20 12,22 9,24" fill="#495057"/>
      <!-- Right Hook -->
      <path d="M19 12 Q26 14, 26 18 Q26 22, 22 22" stroke="#495057" stroke-width="1.8" fill="none"/>
      <polygon points="22,20 20,22 23,24" fill="#495057"/>
      <!-- Center Bottom Hook -->
      <path d="M16 15 L16 25 Q16 30, 20 30" stroke="#495057" stroke-width="1.8" fill="none"/>
      <polygon points="20,28 22,30 19,32" fill="#495057"/>
    </svg>
  `
};

export function getBaitIconSvg(baitId) {
  return BAIT_SVGS[baitId] || BAIT_SVGS.bread;
}
