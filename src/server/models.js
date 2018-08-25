import Sequelize from 'sequelize';
import fs from 'fs';
import { synchronizeStore, getSettings } from './utils';

const DB_FILE = 'db.sqlite';
const DB_DIR = 'data/';
const DB_PATH = `${DB_DIR}/${DB_FILE}`;

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const db = `sqlite://${DB_PATH}`;
export const sequelize = new Sequelize(db, { logging: false, operatorsAliases: Sequelize.Op });

export const User = sequelize.define('user', {
    ip: { type: Sequelize.STRING, validate: { isIP: true } },
    email: { type: Sequelize.STRING, validate: { isEmail: true } },
    password: { type: Sequelize.STRING },
    stripeCustomerId: { type: Sequelize.STRING },
    isSubscribed: { type: Sequelize.BOOLEAN, defaultValue: false },
    isAdmin: { type: Sequelize.BOOLEAN, defaultValue: false },
});

export const Settings = sequelize.define('settings', {
    name: { type: Sequelize.STRING },
    value: { type: Sequelize.STRING },
});

export const Application = sequelize.define('application', {
    releaseName: { type: Sequelize.STRING },
    domainName: { type: Sequelize.STRING },
    state: { type: Sequelize.STRING },
    action: { type: Sequelize.STRING },
    port: { type: Sequelize.STRING },
    error: { type: Sequelize.STRING },
});

export const Package = sequelize.define('package', {
    name: { type: Sequelize.STRING },
    icon: { type: Sequelize.STRING },
    category: { type: Sequelize.STRING },
    stackFileUrl: { type: Sequelize.STRING },
});

export const initializeSettings = async () => {
    const settings = [
        { name: 'orchestratorName' },
        { name: 'orchestratorEndpoint' },
        { name: 'orchestratorToken' },
        { name: 'orchestratorIp' },
        { name: 'isOrchestratorOnline', value: false },
        { name: 'stripeSecretKey' },
        { name: 'stripePublishableKey' },
        { name: 'stripePlanName' },
        { name: 'isMonetizationEnabled', value: false },
        { name: 'isDemoEnabled', value: false },
        { name: 'monthlyPrice', value: '$0' },
        { name: 'storeRepositoryUrl', value: 'https://charts.ethibox.fr/apps.json' },
    ];
    await Promise.all(settings.map(async ({ name, value }) => {
        if (!await Settings.findOne({ where: { name } })) {
            await Settings.create({ name, value });
        }
    }));
};

(async () => {
    Application.User = Application.belongsTo(User);
    User.Applications = User.hasMany(Application);
    Application.Package = Application.belongsTo(Package);
    Package.Applications = Package.hasMany(Application);

    User.sync();
    Application.sync();
    Package.sync();
    Settings.sync();

    await initializeSettings();

    const { storeRepositoryUrl } = await getSettings();
    await synchronizeStore(storeRepositoryUrl);
})();
