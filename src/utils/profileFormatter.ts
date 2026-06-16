/**
 * Utility functions for formatting profile responses in a sophisticated way
 */

export interface ProfileData {
  company?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status?: string;
  account_created?: string;
  [key: string]: any;
}

export const formatProfileResponse = (profileData: any): string => {
  try {
    // Handle different response formats
    let profile: ProfileData = {};
    
    if (profileData?.content?.[0]?.text) {
      // If the profile data is in MCP format, try to parse it
      const content = profileData.content[0].text;
      if (typeof content === 'string' && content.includes('Company:')) {
        // Parse the formatted string
        profile = parseProfileString(content);
      } else if (typeof content === 'object') {
        profile = content;
      }
    } else if (typeof profileData === 'object') {
      profile = profileData;
    }

    // Generate sophisticated profile display
    return generateProfileDisplay(profile);
  } catch (error) {
    console.error('Error formatting profile:', error);
    return "I apologize, but I encountered an issue formatting your profile information. Please try again or contact support if the problem persists.";
  }
};

const parseProfileString = (content: string): ProfileData => {
  const profile: ProfileData = {};
  
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('**Company:**')) {
      profile.company = line.split('**Company:**')[1]?.trim();
    } else if (line.includes('**Contact Person:**')) {
      profile.contact_person = line.split('**Contact Person:**')[1]?.trim();
    } else if (line.includes('**Email:**')) {
      profile.email = line.split('**Email:**')[1]?.trim();
    } else if (line.includes('**Phone:**')) {
      profile.phone = line.split('**Phone:**')[1]?.trim();
    } else if (line.includes('**Status:**')) {
      profile.status = line.split('**Status:**')[1]?.trim();
    } else if (line.includes('**Account Created:**')) {
      profile.account_created = line.split('**Account Created:**')[1]?.trim();
    }
  });
  
  return profile;
};

const generateProfileDisplay = (profile: ProfileData): string => {
  const sections = [];

  // Company Header
  if (profile.company) {
    sections.push(`# 🏢 ${profile.company}`);
    sections.push(''); // Empty line
  }

  // Account Overview Card
  sections.push('## 📋 Account Overview');
  sections.push('---');
  
  const overviewItems = [];
  
  if (profile.email) {
    overviewItems.push(`**📧 Email:** ${profile.email}`);
  }
  
  if (profile.contact_person && profile.contact_person !== 'Not specified') {
    overviewItems.push(`**👤 Contact Person:** ${profile.contact_person}`);
  }
  
  if (profile.phone && profile.phone !== 'Not specified') {
    overviewItems.push(`**📞 Phone:** ${profile.phone}`);
  }
  
  if (profile.status) {
    const statusEmoji = profile.status.toLowerCase() === 'active' ? '✅' : '⚠️';
    overviewItems.push(`**${statusEmoji} Status:** ${toTitleCase(profile.status)}`);
  }
  
  if (profile.account_created) {
    overviewItems.push(`**📅 Member Since:** ${formatDate(profile.account_created)}`);
  }

  if (overviewItems.length > 0) {
    sections.push(overviewItems.join('\n\n'));
  } else {
    sections.push('*Profile information is being updated...*');
  }

  sections.push(''); // Empty line

  // Missing Information Notice
  const missingFields = [];
  if (!profile.contact_person || profile.contact_person === 'Not specified') {
    missingFields.push('Contact Person');
  }
  if (!profile.phone || profile.phone === 'Not specified') {
    missingFields.push('Phone Number');
  }

  if (missingFields.length > 0) {
    sections.push('## 📝 Profile Completion');
    sections.push('---');
    sections.push(`We noticed that some profile fields are missing: **${missingFields.join(', ')}**`);
    sections.push('');
    sections.push('💡 *Having complete profile information helps us serve you better and ensures smooth communication for your orders.*');
    sections.push('');
    sections.push('**To update your profile:** Contact our support team at your convenience.');
    sections.push('');
  }

  // Quick Actions
  sections.push('## ⚡ Quick Actions');
  sections.push('---');
  sections.push('• **Browse Products** - Say "show me products" or "what vegetables do you have"');
  sections.push('• **Create Order** - Say "create order: tomato 2kg, onion 1kg"');
  sections.push('• **View Orders** - Say "show my orders" or "order history"');
  sections.push('• **Check Invoices** - Say "show my invoices"');

  return sections.join('\n');
};

const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString; // Return original string if parsing fails
  }
};