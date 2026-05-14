import {
  Body, Container, Head, Heading, Html,
  Preview, Section, Text, Row, Column, Hr, Link,
} from '@react-email/components'

interface OrderItem {
  name: string
  size: string
  quantity: number
  price: number
  hasCustomization?: boolean
  customName?: string | null
  customNumber?: string | null
}

interface OrderConfirmationProps {
  customerName: string
  orderId: string
  total: number
  items: OrderItem[]
}

export function OrderConfirmation({ customerName, orderId, total, items }: OrderConfirmationProps) {
  const shortId = orderId.slice(-8).toUpperCase()

  return (
    <Html>
      <Head />
      <Preview>Pedido #{shortId} confirmado — Gabinete FC</Preview>
      <Body style={{ backgroundColor: '#0a0a0a', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>
            GABINETE FC
          </Heading>
          <Text style={{ color: '#888888', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', marginTop: 0 }}>
            Pedido Confirmado
          </Text>

          <Hr style={{ borderColor: '#333333', margin: '24px 0' }} />

          <Text style={{ color: '#cccccc', fontSize: '14px' }}>
            Olá, {customerName}!
          </Text>
          <Text style={{ color: '#cccccc', fontSize: '14px' }}>
            Recebemos seu pedido <strong style={{ color: '#ffffff' }}>#{shortId}</strong> e já estamos preparando tudo com cuidado.
          </Text>

          <Section style={{ backgroundColor: '#111111', border: '1px solid #333333', padding: '20px', margin: '24px 0' }}>
            <Text style={{ color: '#888888', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 0 }}>
              Resumo do Pedido
            </Text>
            {items.map((item, i) => (
              <Row key={i} style={{ marginBottom: '8px' }}>
                <Column>
                  <Text style={{ color: '#cccccc', fontSize: '13px', margin: 0 }}>
                    {item.name} <span style={{ color: '#666666' }}>({item.size})</span> × {item.quantity}
                  </Text>
                  {item.hasCustomization && item.customName && item.customNumber && (
                    <Text style={{ color: '#CAFF00', fontSize: '11px', letterSpacing: '1px', margin: '4px 0 0 0' }}>
                      ⚡ PERSONALIZADA · {item.customName} · #{item.customNumber}
                    </Text>
                  )}
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ color: '#ffffff', fontSize: '13px', margin: 0 }}>
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </Text>
                </Column>
              </Row>
            ))}
            <Hr style={{ borderColor: '#333333', margin: '12px 0' }} />
            <Row>
              <Column>
                <Text style={{ color: '#888888', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Total</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                  R$ {total.toFixed(2).replace('.', ',')}
                </Text>
              </Column>
            </Row>
          </Section>

          <Text style={{ color: '#666666', fontSize: '12px', textAlign: 'center' }}>
            Acompanhe seu pedido em{' '}
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/minha-conta/pedidos`} style={{ color: '#cccccc' }}>
              Minha Conta
            </Link>
          </Text>

          <Hr style={{ borderColor: '#222222', margin: '24px 0' }} />
          <Text style={{ color: '#444444', fontSize: '11px', textAlign: 'center', letterSpacing: '1px' }}>
            © {new Date().getFullYear()} GABINETE FC — Todos os direitos reservados
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderConfirmation
