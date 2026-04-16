import {
  Body, Container, Head, Heading, Html,
  Preview, Section, Text, Hr, Link, Row, Column,
} from '@react-email/components'

interface ShippingNotificationProps {
  customerName: string
  orderId: string
  trackingCode: string
  carrier?: string
}

export function ShippingNotification({ customerName, orderId, trackingCode, carrier = 'Correios' }: ShippingNotificationProps) {
  const shortId = orderId.slice(-8).toUpperCase()
  const trackingUrl = `https://rastreamento.correios.com.br/app/index.php?objeto=${trackingCode}`

  return (
    <Html>
      <Head />
      <Preview>Seu pedido #{shortId} foi enviado — Gabinete FC</Preview>
      <Body style={{ backgroundColor: '#0a0a0a', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>
            GABINETE FC
          </Heading>
          <Text style={{ color: '#888888', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', marginTop: 0 }}>
            Pedido Enviado
          </Text>

          <Hr style={{ borderColor: '#333333', margin: '24px 0' }} />

          <Text style={{ color: '#cccccc', fontSize: '14px' }}>
            Olá, {customerName}!
          </Text>
          <Text style={{ color: '#cccccc', fontSize: '14px', lineHeight: '1.6' }}>
            Seu pedido <strong style={{ color: '#ffffff' }}>#{shortId}</strong> saiu para entrega. 🚀
          </Text>

          <Section style={{ backgroundColor: '#111111', border: '1px solid #333333', padding: '20px', margin: '24px 0' }}>
            <Row>
              <Column>
                <Text style={{ color: '#888888', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Transportadora</Text>
                <Text style={{ color: '#ffffff', fontSize: '14px', margin: 0 }}>{carrier}</Text>
              </Column>
              <Column>
                <Text style={{ color: '#888888', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Código de Rastreio</Text>
                <Text style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{trackingCode}</Text>
              </Column>
            </Row>
          </Section>

          <Text style={{ color: '#888888', fontSize: '13px', textAlign: 'center' }}>
            <Link href={trackingUrl} style={{ color: '#cccccc' }}>
              Rastrear meu pedido →
            </Link>
          </Text>

          <Hr style={{ borderColor: '#222222', margin: '24px 0' }} />
          <Text style={{ color: '#444444', fontSize: '11px', textAlign: 'center' }}>
            © {new Date().getFullYear()} GABINETE FC
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ShippingNotification
