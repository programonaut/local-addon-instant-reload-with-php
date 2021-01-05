import * as Local from '@getflywheel/local';
import { getServiceContainer, HooksMain } from '@getflywheel/local/main';
import InstantReload from './main/InstantReload';
import { IPC_EVENTS } from './constants';

const serviceContainer = getServiceContainer().cradle;

export default function (context: typeof serviceContainer.addonLoader.addonContext): void {
	const { electron } = context;
	const { ipcMain } = electron;
	const instantReload = new InstantReload();

	/**
	 * start site
	 * if IR not enabled
	 * 		break
	 * else
	 * 		start browsersync
	 * 		restart the local router (this will be handled by the start method of Local)
	 * 		start up the file watchers
	 */

	HooksMain.addAction('siteStarted', (site: Local.Site) => {
		/**
		 * Here we need to fire up browser sync, rewrite the local router proxy_pass and
		 * live links start port
		 */

		if (site.autoEnableInstantReload) {
			instantReload.createNewConnection(site);
			/**
			 * @todo investigate adding file watchers after the Local router restarts
			 */
			instantReload.addFileWatchers(site);
		}
	});

	HooksMain.addAction('siteStopped', (site: Local.Site) => {
		instantReload.stopConnection(site);
	});

	const toggleInstantReloadFactory = (autoEnableInstantReload: boolean) => (_, siteID: string) => {
		serviceContainer.siteData.updateSite(siteID, {
			autoEnableInstantReload,
		});
	};

	ipcMain.on(IPC_EVENTS.ENABLE_INSTANT_RELOAD, toggleInstantReloadFactory(true));

	ipcMain.on(IPC_EVENTS.DISABLE_INSTANT_RELOAD, toggleInstantReloadFactory(false));
}
