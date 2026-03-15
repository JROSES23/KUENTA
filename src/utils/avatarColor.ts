const AVATAR_COLORS = [
  { bg: 'var(--purple-bg)', text: 'var(--purple-text)' },
  { bg: 'var(--green-bg)',  text: 'var(--green)' },
  { bg: 'rgba(24,95,165,0.12)', text: '#185FA5' },
  { bg: 'var(--red-bg)',   text: 'var(--red)' },
]

export function getAvatarColor(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
