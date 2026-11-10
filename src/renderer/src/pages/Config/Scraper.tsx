import { ScraperCapabilities } from '@appTypes/utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'
import { ConfigItem } from '~/components/form/ConfigItem'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { cn } from '~/utils'

export function Scraper(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [token, setToken] = useState('')
  const [tokenStatus, setTokenStatus] = useState<{
    available: boolean
    configured: boolean
  } | null>(null)
  const [tokenBusy, setTokenBusy] = useState(false)
  const [tokenError, setTokenError] = useState(false)

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('bangumi-token:get-status')
      .then(setTokenStatus)
      .catch(() => setTokenError(true))
  }, [])

  const updateToken = async (action: 'set' | 'clear'): Promise<void> => {
    setTokenBusy(true)
    setTokenError(false)
    try {
      if (action === 'set') {
        await window.electron.ipcRenderer.invoke('bangumi-token:set', token.trim())
      } else {
        await window.electron.ipcRenderer.invoke('bangumi-token:clear')
      }
      setToken('')
      setTokenStatus(await window.electron.ipcRenderer.invoke('bangumi-token:get-status'))
    } catch {
      setTokenError(true)
    } finally {
      setTokenBusy(false)
    }
  }
  const [availableDataSources, setAvailableDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])
  const [availableMediaDataSources, setAvailableMediaDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const availableDataSources = await ipcManager.invoke(
        'scraper:get-provider-infos-with-capabilities',
        ['searchGames', 'checkGameExists', 'getGameMetadata', 'getGameBackgrounds', 'getGameCovers']
      )
      setAvailableDataSources(availableDataSources)
    }
    fetchAvailableDataSources()
  }, [])

  useEffect(() => {
    const fetchAvailableMediaDataSources = async (): Promise<void> => {
      const availableDataSources = await ipcManager.invoke(
        'scraper:get-provider-infos-with-capabilities',
        ['getGameCovers', 'getGameIcons', 'getGameLogos', 'getGameBackgrounds'],
        false
      )
      setAvailableMediaDataSources(availableDataSources)
    }
    fetchAvailableMediaDataSources()
  }, [])

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('scraper.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-8')}>
          {/* General Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.common.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.common.defaultDataSource"
                title={t('scraper.common.defaultDataSource')}
                controlType="select"
                description={t('scraper.common.defaultDataSourceDescription')}
                options={availableDataSources.map((ds) => ({
                  value: ds.id,
                  label: ds.name
                }))}
                controlClassName="w-[200px]"
              />
            </div>

            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.common.defaultMediaDataSource"
                title={t('scraper.common.defaultMediaDataSource')}
                controlType="select"
                description={t('scraper.common.defaultMediaDataSourceDescription')}
                options={availableMediaDataSources.map((ds) => ({
                  value: ds.id,
                  label: ds.name
                }))}
                controlClassName="w-[200px]"
              />
            </div>

            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.common.fetchScoreOnAdd"
                title={t('scraper.common.fetchScoreOnAdd')}
                controlType="switch"
                description={t('scraper.common.fetchScoreOnAddDescription')}
              />
            </div>

            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.common.cacheDescriptionImages"
                title={t('scraper.common.cacheDescriptionImages')}
                controlType="switch"
                description={t('scraper.common.cacheDescriptionImagesDescription')}
              />
            </div>
          </div>

          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.bangumi.title')}</div>
            <p className="text-sm text-muted-foreground">{t('scraper.bangumi.description')}</p>
            <a
              className="text-sm text-primary underline"
              href="https://next.bgm.tv/demo/access-token"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('scraper.bangumi.getToken')}
            </a>
            <p className="text-sm" aria-live="polite">
              {tokenStatus
                ? t(
                    tokenStatus.configured
                      ? 'scraper.bangumi.configured'
                      : 'scraper.bangumi.notConfigured'
                  )
                : t('scraper.bangumi.loading')}
              {tokenStatus && !tokenStatus.available && ` ${t('scraper.bangumi.unavailable')}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="password"
                autoComplete="off"
                aria-label={t('scraper.bangumi.token')}
                placeholder={t('scraper.bangumi.token')}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="max-w-sm"
                disabled={tokenBusy || !tokenStatus?.available}
              />
              <Button
                disabled={tokenBusy || !tokenStatus?.available || !token.trim()}
                onClick={() => void updateToken('set')}
              >
                {t('scraper.bangumi.save')}
              </Button>
              <Button
                variant="outline"
                disabled={tokenBusy || !tokenStatus?.configured}
                onClick={() => void updateToken('clear')}
              >
                {t('scraper.bangumi.clear')}
              </Button>
            </div>
            {tokenError && (
              <p className="text-sm text-destructive" role="alert">
                {t('scraper.bangumi.error')}
              </p>
            )}
          </div>

          {/* VNDB Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.vndb.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.vndb.tagSpoilerLevel"
                title={t('scraper.vndb.tagSpoilerLevel')}
                controlType="select"
                description={t('scraper.vndb.tagSpoilerLevelDescription')}
                options={[
                  { value: 0, label: t('scraper.vndb.tagSpoilerLevels.none') },
                  { value: 1, label: t('scraper.vndb.tagSpoilerLevels.minor') },
                  { value: 2, label: t('scraper.vndb.tagSpoilerLevels.all') }
                ]}
                controlClassName="w-[200px]"
              />
            </div>
          </div>

          {/* DLSite Settings */}
          <div className={cn('space-y-4')}>
            <div className={cn('border-b pb-2')}>{t('scraper.dlsite.title')}</div>
            <div className={cn('space-y-4')}>
              <ConfigItem
                hookType="config"
                path="game.scraper.dlsite.findIdInName"
                title={t('scraper.dlsite.findIdInName')}
                controlType="switch"
                description={t('scraper.dlsite.findIdInNameDescription')}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
