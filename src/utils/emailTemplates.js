const appConfig = require("../config/appConfig");

// Base template structure to maintain consistency
function baseTemplate(content, options = {}) {
  const {
    title = '',
    subtitle = '',
    showLogo = true,
    primaryColor = '#4f46e5',
    secondaryColor = '#7c3aed',
    footerLinks = true
  } = options;

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;">
      <!-- Gradient Border Container -->
      <div style="background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}); padding: 2px; border-radius: 12px;">
        <!-- Main Content Card -->
        <div style="background: #ffffff; border-radius: 10px; overflow: hidden;">
          <!-- Header with Logo -->
          <div style="padding: 30px 20px; text-align: center; background: linear-gradient(135deg, #f9fafb, #ffffff);">
            ${showLogo ? `
              <img src="https://i.ibb.co/fdrJ4Gkz/nexa-ease-logo-transparent.png" alt="NexaEase" 
                   style="height: 50px; width: auto; margin-bottom: 15px;">
            ` : ''}
            ${title ? `<h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">${title}</h2>` : ''}
            ${subtitle ? `<p style="font-size: 16px; color: #4b5563; margin-top: 10px;">${subtitle}</p>` : ''}
          </div>
          
          <!-- Dynamic Content -->
          <div style="padding: 30px;">
            ${content}
          </div>
          
          <!-- Footer -->
          <div style="padding: 20px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              ${footerLinks ? `
                <a href="${appConfig.BASE_URL}/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a> 
                • 
                <a href="${appConfig.BASE_URL}/terms" style="color: #6b7280; text-decoration: none;">Terms of Service</a>
                <br>
              ` : ''}
              <span style="color: #9ca3af;">© ${new Date().getFullYear()} NexaEase. All rights reserved.</span>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Watermark -->
      <p style="font-size: 11px; text-align: center; color: #d1d5db; margin-top: 20px;">
        Secured with NexaEase Communication
      </p>
    </div>
  `;
}

// CONTACT FORM TEMPLATE
function contactFormTemplate(email, message, name) {
  const content = `
    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      Hi <strong style="color: #1e293b;">${name}</strong>,
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 25px;">
      We've received your message and our team will get back to you shortly. 
      Here's what you sent us:
    </p>
    
    <!-- User Details Card -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
      <div style="margin-bottom: 15px;">
        <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 500; color: #64748b;">YOUR EMAIL</p>
        <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 500;">${email}</p>
      </div>
      
      <div>
        <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 500; color: #64748b;">YOUR MESSAGE</p>
        <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.5;">${message}</p>
      </div>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 30px;">
      We typically respond within 24 hours. For urgent matters, please call our 
      support line at <strong style="color: #4f46e5;">+92 300 1234567</strong>.
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appConfig.BASE_URL}" target="_blank"
         style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5, #7c3aed); 
                color: white; text-decoration: none; border-radius: 6px; font-weight: 500; 
                font-size: 15px; box-shadow: 0 2px 4px rgba(79,70,229,0.2);">
        Visit Our Website
      </a>
    </div>
  `;

  return baseTemplate(content, {
    title: 'Thank You for Contacting Us',
    subtitle: 'We appreciate your message'
  });
}

// ORDER CONFIRMATION TEMPLATE
function orderPlacedTemplate({ orderNumber, createdAt, username, address, phone, total, items }) {
  const content = `
    <!-- Customer Info Card -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
      <div style="margin-bottom: 15px;display:flex;flex-direction:row; justify-content: space-between;">
        <div>
          <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 500; color: #64748b;">ORDER NUMBER</p>
          <a href="${appConfig.BASE_URL}/order/track/?order-id=${orderNumber}" target="_blank" 
             style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 600; text-decoration: none;">
            ${orderNumber}
          </a>
        </div>
        <div style="margin-left: 20%">
          <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 500; color: #64748b;">PLACED ON</p>
          <p style="margin: 0; font-size: 15px; color: #1e293b;">${createdAt.split('at')[0].trim()}</p>
        </div>
      </div>

      <div style="margin-bottom: 15px;display:flex;flex-direction:row; justify-content: space-between;">
        <div>
          <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 500; color: #64748b;">CONTACT</p>
          <p style="margin: 0; font-size: 15px; color: #1e293b;">${phone}</p>
        </div>
        <div style="margin-left: 20%">
          <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 500; color: #64748b;">ADDRESS</p>
          <p style="margin: 0; font-size: 15px; color: #1e293b;">${address}</p>
        </div>
      </div>
    </div>

    <!-- Total Amount -->
    <div style="background: #ffffff; border-radius: 6px; padding: 15px; text-align: center; margin-bottom: 30px; border: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 13px; font-weight: 500; color: #64748b;">TOTAL AMOUNT</p>
      <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #4f46e5;">Rs ${total}</p>
    </div>
    
    <!-- Order Items -->
    <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827;">Order Summary</h3>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 12px 15px; text-align: left; font-size: 14px; font-weight: 500; color: #64748b;">Product</th>
            <th style="padding: 12px 15px; text-align: center; font-size: 14px; font-weight: 500; color: #64748b;">Qty</th>
            <th style="padding: 12px 15px; text-align: right; font-size: 14px; font-weight: 500; color: #64748b;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 15px; font-size: 14px; color: #1e293b;">
                <a href="${appConfig.BASE_URL}/product/?id=${item.product_id}" target="_blank" 
                   style="color: #1e293b; text-decoration: none;">${item.product_name}</a>
              </td>
              <td style="padding: 15px; text-align: center; font-size: 14px; color: #1e293b;">${item.quantity}</td>
              <td style="padding: 15px; text-align: right; font-size: 14px; color: #1e293b; font-weight: 500;">Rs ${item.price}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Shipping Info -->
    <div style="background: #f0fdf4; border-radius: 8px; padding: 15px; margin-top: 25px; border: 1px solid #bbf7d0;">
      <p style="margin: 0; font-size: 14px; color: #166534; text-align: center;">
        You'll receive a shipping confirmation email when your order is on its way!
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0 20px;">
      <a href="${appConfig.BASE_URL}/order/track/?order-id=${orderNumber}" target="_blank"
         style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5, #7c3aed); 
                color: white; text-decoration: none; border-radius: 6px; font-weight: 500; 
                font-size: 15px; box-shadow: 0 2px 4px rgba(79,70,229,0.2);">
        Track Your Order
      </a>
    </div>
  `;

  return baseTemplate(content, {
    title: 'Order Confirmation',
    subtitle: `Thank you for your purchase, ${username}!`
  });
}

// MAGIC LINK TEMPLATE
function magicLinkTemplate(verifyUrl, email) {
  const content = `
    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; text-align: center;">
      Click the button below to securely log in to your NexaEase account. This link will expire in 
      <strong style="color: #4f46e5;">15 minutes</strong> and can only be used once.
    </p>

    <!-- Action Button -->
    <div style="text-align: center; margin: 0 auto 30px;">
      <a href="${verifyUrl}" 
         style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5, #7c3aed); 
                color: white; text-decoration: none; border-radius: 6px; font-weight: 500; 
                font-size: 16px; box-shadow: 0 2px 4px rgba(79,70,229,0.2);">
        Log In Securely
      </a>
    </div>

    <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px; text-align: center;">
      Or copy and paste this link into your browser:
    </p>
    <div style="font-size: 13px; color: #4b5563; word-break: break-all; background: #f3f4f6; 
               padding: 12px; border-radius: 3px; border: 1px solid #e5e7eb; text-align: center;">
      ${verifyUrl}
    </div>

    <p style="font-size: 14px; color: #4b5563; margin-top: 24px; text-align: center;">
      This login link was requested for <strong style="color: #1e1e1e;">${email}</strong>.
      <br>If you didn't request this, please <a href="mailto:${appConfig.SUPPORT_EMAIL}" 
         style="color: #4f46e5; text-decoration: none;">contact support</a>.
    </p>
  `;

  return baseTemplate(content, {
    title: 'Your Secure Login Link',
    subtitle: 'NexaEase Authentication',
    showLogo: true
  });
}

// NEWSLETTER SUBSCRIPTION CONFIRMATION
function newsletterSubscriptionTemplate(email, unsubscribeLink) {
  const content = `
    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      Welcome to the NexaEase newsletter!
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 25px;">
      Thank you for subscribing with <strong style="color: #1e293b;">${email}</strong>. 
      You'll now receive our latest updates, exclusive offers, and helpful content directly to your inbox.
    </p>
    
    <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #bae6fd;">
      <p style="margin: 0 0 10px 0; font-size: 15px; color: #0369a1; font-weight: 500;">
        What to expect:
      </p>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">Weekly product updates</li>
        <li style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">Exclusive subscriber discounts</li>
        <li style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">Helpful tips and tutorials</li>
        <li style="font-size: 14px; color: #4b5563;">Early access to new features</li>
      </ul>
    </div>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 30px;">
      If you ever change your mind, you can <a href="${unsubscribeLink}" 
      style="color: #4f46e5; text-decoration: none;">unsubscribe here</a>.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appConfig.BASE_URL}" target="_blank"
         style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5, #7c3aed); 
                color: white; text-decoration: none; border-radius: 6px; font-weight: 500; 
                font-size: 15px; box-shadow: 0 2px 4px rgba(79,70,229,0.2);">
        Explore Our Website
      </a>
    </div>
  `;

  return baseTemplate(content, {
    title: 'Welcome to Our Newsletter!',
    subtitle: 'Thanks for joining our community'
  });
}

// NEWSLETTER UNSUBSCRIBE CONFIRMATION
function newsletterUnsubscribeTemplate(email) {
  const content = `
    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      We're sorry to see you go!
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 25px;">
      You have been successfully unsubscribed from the NexaEase newsletter. 
      The email address <strong style="color: #1e293b;">${email}</strong> will no longer receive our updates.
    </p>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 15px; color: #4b5563; text-align: center;">
        If this was a mistake or you'd like to resubscribe, you can do so at any time on our website.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appConfig.BASE_URL}" target="_blank"
         style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5, #7c3aed); 
                color: white; text-decoration: none; border-radius: 6px; font-weight: 500; 
                font-size: 15px; box-shadow: 0 2px 4px rgba(79,70,229,0.2);">
        Visit Our Website
      </a>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-top: 30px; text-align: center;">
      We'd appreciate your feedback on why you unsubscribed to help us improve.
      <a href="mailto:${appConfig.FEEDBACK_EMAIL}?subject=Newsletter%20Feedback" 
         style="color: #4f46e5; text-decoration: none;">Send feedback</a>
    </p>
  `;

  return baseTemplate(content, {
    title: 'You\'ve Been Unsubscribed',
    subtitle: 'We hope to see you again soon'
  });
}

// NEWSLETTER ISSUE TEMPLATE
function newsletterIssueTemplate(content, unsubscribeToken) {
  const unsubscribeLink = `${appConfig.BASE_URL}/newsletter/unsubscribe/${unsubscribeToken}`;

  return baseTemplate(`
    ${content}
    
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <div style="text-align: center; font-size: 13px; color: #6b7280;">
      <p style="margin: 0 0 10px 0;">
        You're receiving this email because you subscribed to the NexaEase newsletter.
      </p>
      <a href="${unsubscribeLink}" 
         style="color: #6b7280; text-decoration: none;">Unsubscribe</a> 
      • 
      <a href="${appConfig.BASE_URL}/preferences" 
         style="color: #6b7280; text-decoration: none;">Update preferences</a>
    </div>
  `, {
    showLogo: true,
    footerLinks: false
  });
}

module.exports = {
  contactFormTemplate,
  orderPlacedTemplate,
  magicLinkTemplate,
  newsletterSubscriptionTemplate,
  newsletterUnsubscribeTemplate,
  newsletterIssueTemplate
};