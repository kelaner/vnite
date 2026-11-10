import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { useConfigState } from '~/hooks'
import { sortGames, useVisibleGameIds } from '~/stores/game'
import { useGameRegistry } from '~/stores/game/gameRegistry'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { useGameListStore } from '../store'
import { AllGameComponent } from './AllGame'
import { GroupSortSummary } from './GroupSortSummary'
import { PlaceHolder } from './PlaceHolder'
import { RecentGames } from './RecentGames'

import { getScoreSourceGroups } from './scoreSourceGroups'

function ScoreSourceGamesComponent({
  scrollPosition
}: {
  scrollPosition: { x: number; y: number }
}): React.JSX.Element {
  const [sort] = useConfigState('game.gameList.sort')
  const [showAllGamesInGroup] = useConfigState('game.gameList.showAllGamesInGroup')
  const visibleGameIds = useVisibleGameIds()
  const metadata = useGameRegistry((s) => s.gameMetaIndex)
  const groups = getScoreSourceGroups(visibleGameIds, metadata)
  const setOpenValues = useGameListStore((s) => s.setOpenValues)
  const openValues = useGameListStore((s) => s.getOpenValues('record.scoreSource'))
  const { t } = useTranslation('game')

  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3 pt-1 pb-1')}>
      <Accordion
        key="record.scoreSource"
        value={openValues}
        onValueChange={(values) => setOpenValues('record.scoreSource', values)}
        type="multiple"
        className={cn('w-full text-xs flex flex-col gap-2')}
      >
        <RecentGames />
        {Object.entries(groups).map(([field, gameIds]) => (
          <AccordionItem key={field} value={field}>
            <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
              <div className={cn('flex flex-row items-center justify-start gap-1')}>
                <div className={cn('text-xs')}>
                  {field === 'personal'
                    ? t('list.scoreSource.personal')
                    : field === 'empty'
                      ? t('list.scoreSource.empty')
                      : field.slice('source:'.length)}
                </div>
                <GroupSortSummary gameIds={gameIds} sort={sort} />
              </div>
            </AccordionTrigger>
            <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
              {sortGames(sort, gameIds).map((game) => (
                <LazyLoadComponent
                  key={game}
                  threshold={300}
                  scrollPosition={scrollPosition}
                  placeholder={
                    <PlaceHolder gameId={game} groupId={`record.scoreSource:${field}`} />
                  }
                >
                  <GameNav gameId={game} groupId={`record.scoreSource:${field}`} />
                </LazyLoadComponent>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
        {showAllGamesInGroup && <AllGameComponent scrollPosition={scrollPosition} />}
      </Accordion>
    </ScrollArea>
  )
}

export const ScoreSourceGames = trackWindowScroll(ScoreSourceGamesComponent)
