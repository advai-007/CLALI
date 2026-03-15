/**
 * Shared emoji constants used across the app.
 * - secretIcons: used in AddStudentPage (teacher picks) AND StudentLoginPage (student taps to log in).
 *   Keep these two lists IDENTICAL so every icon a teacher can assign is visible at login.
 * - avatarEmojis: animal avatars for student profile pictures.
 */

export const SECRET_ICONS = [
    // Food & Drink
    '🍕', '🍔', '🍦', '🍩', '🍿', '🍓', '🍉', '🍇',
    '🍒', '🍑', '🥝', '🍋', '🌽', '🥕', '🧁', '🎂',
    // Space & Nature
    '🚀', '⭐', '🌈', '🌙', '☀️', '🌊', '🔥', '❄️',
    '🌸', '🌺', '🌻', '🍀', '🌵', '🍄', '💎', '🌍',
    // Sports & Games
    '⚽', '🏀', '🏈', '🎾', '🎮', '🧩', '🎯', '🏆',
    '🎪', '🎢', '🎡', '🎠', '🎲', '♟️', '🎴', '🃏',
    // Music & Art
    '🎸', '🎹', '🎺', '🎻', '🥁', '🎨', '✏️', '📚',
    // Objects
    '🚲', '🚂', '✈️', '🚁', '⚓', '🔭', '🔬', '💡',
    '🎧', '📷', '🧸', '🪆', '🪄', '🧲', '🔑', '🎁',
];

export const AVATAR_EMOJIS = [
    '🐼', '🦄', '🐱', '🐶', '🐻', '🦊', '🦁', '🐯',
    '🐸', '🐧', '🐨', '🦒', '🦩', '🐒', '🦥', '🦔',
    '🐙', '🦋', '🐬', '🦀', '🐢', '🦜', '🐳', '🦡',
];
