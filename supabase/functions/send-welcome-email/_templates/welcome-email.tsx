import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  userName: string
  agencyName: string
  email: string
  password: string
  loginUrl: string
  userRole: string
}

export const WelcomeEmail = ({
  userName,
  agencyName,
  email,
  password,
  loginUrl,
  userRole,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {agencyName} - Your BuildFlow Account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {agencyName}!</Heading>
        
        <Text style={text}>Hi {userName},</Text>
        
        <Text style={text}>
          Your administrator has created a BuildFlow account for you at {agencyName}. 
          You can now access the construction management platform with your assigned role: <strong>{userRole}</strong>.
        </Text>

        <Section style={loginSection}>
          <Heading style={h2}>Your Login Credentials</Heading>
          <Text style={credentialsText}>
            <strong>Email:</strong> {email}
          </Text>
          <Text style={credentialsText}>
            <strong>Temporary Password:</strong> <span style={passwordStyle}>{password}</span>
          </Text>
        </Section>

        <Section style={buttonSection}>
          <Link
            href={loginUrl}
            target="_blank"
            style={button}
          >
            Sign In to BuildFlow
          </Link>
        </Section>

        <Hr style={hr} />

        <Section style={securitySection}>
          <Heading style={h3}>Important Security Notice</Heading>
          <Text style={text}>
            • You will be required to change your password on first login
          </Text>
          <Text style={text}>
            • Keep your credentials secure and do not share them with others
          </Text>
          <Text style={text}>
            • If you have any issues accessing your account, contact your administrator
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          This email was sent from BuildFlow Construction Management System for {agencyName}.
          If you believe you received this email in error, please contact your administrator.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
}

const h3 = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
}

const credentialsText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
  padding: '0 40px',
}

const passwordStyle = {
  backgroundColor: '#f4f4f4',
  padding: '4px 8px',
  borderRadius: '4px',
  fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
  fontSize: '13px',
}

const loginSection = {
  backgroundColor: '#f8f9fa',
  margin: '32px 0',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const securitySection = {
  backgroundColor: '#fff3cd',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #ffeaa7',
  margin: '20px 0',
}

const hr = {
  borderColor: '#e9ecef',
  margin: '32px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  textAlign: 'center' as const,
}