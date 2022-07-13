const sgMail = require('@sendgrid/mail')



//const sendGridAPIKey = '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'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'info@braapdoc.com',
        subject: 'Welcome to Task App',
        text: `Welcome to the Task App, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'info@braapdoc.com',
        subject: 'Sorry to see you leave',
        text: `${name}, we are very sorry to see you leave. Please let us know how we can improve our service.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}