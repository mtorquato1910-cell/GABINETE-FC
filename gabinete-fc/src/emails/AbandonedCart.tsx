import {
  Body, Container, Head, Heading, Html,
  Preview, Section, Text, Hr, Link, Button,
} from '@react-email/components'

interface AbandonedCartProps {
  customerName: string
  cartValue: number
  recoveryLink: string
}

export function AbandonedCart({ customerName, cartValue, recoveryLink }: AbandonedCartProps) {
  return (
    <Html>
      <Head />
      <Preview>Você esqueceu algo no carrinho — Gabinete FC</Preview>
      <Body style={{ backgroundColor: '#0a0a0a', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>
            GABINETE FC
          </Heading>

          <Hr style={{ borderColor: '#333333', margin: '24px 0' }} />

          <Text style={{ color: '#cccccc', fontSize: '14px' }}>
            Olá, {customerName}!
          </Text>
          <Text style={{ color: '#cccccc', fontSize: '14px', lineHeight: '1.6' }}>
            Você deixou <strong style={{ color: '#ffffff' }}>R$ {cartValue.toFixed(2).replace('.', ',')}</strong> em produtos esperando no seu carrinho.
          </Text>
          <Text style={{ color: '#888888', fontSize: '13px' }}>
            Sua seleção está guardada — finalize agora antes de esgotar.
          </Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={recoveryLink}
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                padding: '14px 32px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Finalizar Compra
            </Button>
          </Section>

          <Hr style={{ borderColor: '#222222', margin: '24px 0' }} />
          <Text style={{ color: '#444444', fontSize: '11px', textAlign: 'center' }}>
            © {new Date().getFullYear()} GABINETE FC — Para cancelar notificações,{' '}
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/minha-conta`} style={{ color: '#666666' }}>
              acesse sua conta
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default AbandonedCart
