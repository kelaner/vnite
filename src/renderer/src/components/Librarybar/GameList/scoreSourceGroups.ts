import type { GameMetaInfo } from '~/stores/game/gameRegistry'

export function getScoreSourceGroups(
  gameIds: readonly string[],
  metadata: Record<string, GameMetaInfo>
): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const gameId of gameIds) {
    const game = metadata[gameId]
    const source = game?.scoreSource
    const key = source ? `source:${source}` : (game?.score ?? -1) >= 0 ? 'personal' : 'empty'
    ;(groups[key] ??= []).push(gameId)
  }
  return groups
}
