const crypto = require('crypto');
const { getDB } = require('../config/dbConfig');
const sendEmail = require('../utils/emailService');
const config = require('../config/appConfig');

const {
    newsletterSubscriptionTemplate, newsletterUnsubscribeTemplate, newsletterIssueTemplate
} = require('../utils/emailTemplates');

const { validateEmail } = require('../utils/validators');

exports.subscribe = async (req, res) => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'A valid email address is required.',
        });
    }

    try {
        const db = getDB();
        const collection = db.collection('newsletter');

        // Check if email exists
        const existing = await collection.findOne({ email });

        // Generate token only once
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        const unsubscribeLink = `${config.BASE_URL}/api/newsletter/unsubscribe/${unsubscribeToken}`;

        if (existing) {
            if (existing.status === 'subscribed') {
                return res.status(200).json({
                    success: true,
                    message: 'This email is already subscribed.',
                });
            }

            // Update existing record
            await collection.updateOne(
                { email },
                {
                    $set: {
                        status: 'subscribed',
                        subscribedAt: new Date(),
                        unsubscribeToken,
                        lastUpdated: new Date(),
                    },
                    $unset: { unsubscribedAt: "" },
                }
            );
        } else {
            // Insert new record
            await collection.insertOne({
                email,
                subscribedAt: new Date(),
                status: 'subscribed',
                unsubscribeToken,
                lastUpdated: new Date(),
            });
        }

        // Send welcome email (fire-and-forget)
        try {
            const html = newsletterSubscriptionTemplate(email, unsubscribeLink);
            await sendEmail({
                to: email,
                subject: `Welcome to ${config.APP_NAME}'s Newsletter!`,
                text: `Welcome to ${config.APP_NAME}'s Newsletter!`,
                html,
            });
        } catch (emailError) {
            console.error(`Failed to send welcome email to ${email}:`, emailError);
        }

        return res.status(200).json({
            success: true,
            message: 'Subscription successful.',
        });
    } catch (err) {
        console.error('Subscription error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

exports.unsubscribe = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).send(`
            <html>
                <head><title>Unsubscribe Error</title></head>
                <body>
                    <h1>Missing Token</h1>
                    <p>Unsubscribe token is required. Please use the link from your email.</p>
                    <p><a href="${config.BASE_URL}">Return to homepage</a></p>
                </body>
            </html>
        `);
    }

    const sanitizedToken = token.trim();

    try {
        const db = getDB();
        const collection = db.collection('newsletter');

        const subscriber = await collection.findOne({ unsubscribeToken: sanitizedToken });

        if (!subscriber) {
            return res.status(404).send(`
                <html>
                    <head><title>Invalid Link</title></head>
                    <body>
                        <h1>Invalid or Expired Link</h1>
                        <p>This unsubscribe link is invalid or has expired.</p>
                        <p>If you wish to unsubscribe, please contact support or try resubscribing and unsubscribing again.</p>
                        <p><a href="${config.BASE_URL}">Return to homepage</a></p>
                    </body>
                </html>
            `);
        }

        if (subscriber.status === 'subscribed') {
            await collection.updateOne(
                { unsubscribeToken: sanitizedToken },
                {
                    $set: {
                        status: 'unsubscribed',
                        unsubscribedAt: new Date(),
                        lastUpdated: new Date(),
                        unsubscribeToken: null,
                    },
                }
            );

            try {
                const html = newsletterUnsubscribeTemplate(subscriber.email);
                await sendEmail({
                    to: subscriber.email,
                    subject: `You've unsubscribed from ${config.APP_NAME}`,
                    text: `You've been unsubscribed from ${config.APP_NAME}. You will no longer receive our newsletters.`,
                    html,
                });
            } catch (emailError) {
                console.error(`Failed to send unsubscribe confirmation to ${subscriber.email}:`, emailError);
            }
        }

        return res.send(`
            <html>
                <head>
                    <title>Unsubscribed</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                        .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <h1>Unsubscription Complete</h1>
                    <div class="success-box">
                        <p>You've been successfully unsubscribed from ${config.APP_NAME} newsletters.</p>
                        <p>The email address <strong>${subscriber.email}</strong> will no longer receive our communications.</p>
                    </div>
                    <p><a href="${config.BASE_URL}">Return to our website</a></p>
                </body>
            </html>
        `);

    } catch (err) {
        console.error('Unsubscribe error:', err);
        return res.status(500).send(`
            <html>
                <head><title>Error</title></head>
                <body>
                    <h1>Something Went Wrong</h1>
                    <p>We encountered an error processing your unsubscription. Please try again later.</p>
                    <p><a href="${config.BASE_URL}">Return to homepage</a></p>
                </body>
            </html>
        `);
    }
}

exports.getAllSubscribers = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('newsletter');

        const subscribers = await collection
            .find({}, { projection: { _id: 0, unsubscribeToken: 0 } })
            .sort({ subscribedAt: -1 })
            .toArray();

        return res.status(200).json({
            success: true,
            total: subscribers.length,
            data: subscribers
        });
    } catch (err) {
        console.log('Get subscribers error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscribers.'
        });
    }
}

exports.sendNewsletterToAll = async (req, res) => {
    const { subject, htmlContent, textContent } = req.body;

    if (!subject || !htmlContent || !textContent) {
        return res.status(400).json({
            success: false,
            message: 'Subject, HTML content, and text content are required.'
        });
    }

    try {
        const db = getDB();
        const collection = db.collection('newsletter');

        // Get active subscribers
        const subscribers = await collection
            .find({ status: 'subscribed' })
            .project({ email: 1, unsubscribeToken: 1, _id: 0 })
            .toArray();

        if (subscribers.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active subscribers to send to.'
            });
        }

        // Track successful/failed sends
        let successfulSends = 0;
        const failedEmails = [];

        // Send emails with rate limiting
        const BATCH_SIZE = 10; // Process 10 at a time
        for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
            const batch = subscribers.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (sub) => {
                try {
                    const { html } = newsletterIssueTemplate(
                        htmlContent,
                        sub.unsubscribeToken
                    );

                    await sendEmail({
                        to: sub.email,
                        subject,
                        text: textContent,
                        html
                    });
                    successfulSends++;
                } catch (emailError) {
                    console.log(`Failed to send newsletter to ${sub.email}:`, emailError);
                    failedEmails.push(sub.email);
                }
            }));

            // Small delay between batches to avoid overwhelming the email service
            if (i + BATCH_SIZE < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const resultMessage = `Newsletter delivered to ${successfulSends} subscribers.` +
            (failedEmails.length > 0 ? ` Failed to send to ${failedEmails.length} emails.` : '');

        return res.status(200).json({
            success: true,
            message: resultMessage,
            stats: {
                totalSubscribers: subscribers.length,
                successfulSends,
                failedSends: failedEmails.length,
                failedEmails: failedEmails.length > 0 ? failedEmails : undefined
            }
        });

    } catch (err) {
        console.log('Send newsletter error:', err);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while sending the newsletter.'
        });
    }
}