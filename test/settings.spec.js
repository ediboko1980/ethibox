import jwt from 'jsonwebtoken';

describe('Settings page', () => {
    before(() => {
        cy.request('GET', '/test/reset');
        cy.request('POST', '/test/users', { users: [{ email: 'contact@ethibox.fr', password: 'myp@ssw0rd', isAdmin: true }] });
        cy.request('POST', '/test/settings', { settings: [
            { name: 'stripeSecretKey' },
            { name: 'stripePublishableKey' },
            { name: 'stripePlanName' },
            { name: 'isMonetizationEnabled', value: false },
            { name: 'isDemoEnabled', value: false },
            { name: 'monthlyPrice', value: 0 },
        ] });
    });

    it('Should change password', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('input[name="password"]').type('mynewp@ass0rd');
        cy.get('input[name="confirmPassword"]').type('mynewp@ass0rd');
        cy.get('button[name="password"]').click();
        cy.contains('.modal', 'Password updated!');
    });

    it('Should display an error if passwords do not match.', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('input[name="password"]').type('mynewp@ass0rd');
        cy.get('input[name="confirmPassword"]').type('mynewbadp@ass0rd');
        cy.get('button[name="password"]').click();
        cy.contains('.error', 'Passwords doesn\'t match');
    });

    it('Should display an error if passwords is too short.', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('input[name="password"]').type('new');
        cy.get('input[name="confirmPassword"]').type('new');
        cy.get('button[name="password"]').click();
        cy.contains('.error', 'Your password must be at least 6 characters');
    });

    it('Should enable monetization', () => {
        const token = jwt.sign({ userId: 1 }, 'mysecret', { expiresIn: '1d' });
        cy.visit('/settings', { onBeforeLoad: (win) => { win.fetch = null; win.localStorage.setItem('token', token); } });
        cy.get('.monetization .checkbox').click();
        cy.get('input[name="stripeSecretKey"]').type(Cypress.env('STRIPE_SECRET_KEY'));
        cy.get('input[name="stripePublishableKey"]').type(Cypress.env('STRIPE_PUBLISHABLE_KEY'));
        cy.get('input[name="stripePlanName"]').type(Cypress.env('STRIPE_PLAN_NAME'));
        cy.get('button[name="save"]').click();
        cy.contains('.modal', 'Configuration updated!');
        cy.get('.modal button').click();
        cy.get('.subscribe .checkbox').click();
        cy.get('.message').not('Bad stripe publishable key');
    });
});