import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './PaymentMethodSelector.css';

export interface PaymentMethodSelectorProps {
  onSelect: (gateway: string, method: string) => void;
}

interface Gateway {
  id: string;
  name: string;
  methods: PaymentMethodOption[];
}

interface PaymentMethodOption {
  id: string;
  name: string;
  description?: string;
}

export function PaymentMethodSelector({ onSelect }: PaymentMethodSelectorProps) {
  const { t } = useLanguage();
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const GATEWAYS: Gateway[] = [
    {
      id: 'newebpay',
      name: t('payment.newebpay') || '藍新金流',
      methods: [
        { id: 'credit_card', name: t('payment.creditCard') || '信用卡', description: t('payment.creditCard.desc') || '支持 Visa、Mastercard、JCB' },
        { id: 'atm', name: t('payment.atm') || 'ATM 轉賬', description: t('payment.atm.desc') || '虛擬帳號轉賬，3天內完成' },
        { id: 'cvs', name: t('payment.cvs') || '超商代碼', description: t('payment.cvs.desc') || '7-11、全家、萊爾富' }
      ]
    },
    {
      id: 'ecpay',
      name: t('payment.ecpay') || '綠界科技',
      methods: [
        { id: 'credit_card', name: t('payment.creditCard') || '信用卡', description: t('payment.creditCard.desc') || '支持 Visa、Mastercard、JCB' },
        { id: 'atm', name: t('payment.atm') || 'ATM 轉賬', description: t('payment.atm.desc') || '虛擬帳號轉賬，3天內完成' },
        { id: 'cvs', name: t('payment.cvs') || '超商代碼', description: t('payment.cvs.desc') || '7-11、全家、萊爾富' },
        { id: 'barcode', name: t('payment.barcode') || '超商條碼', description: t('payment.barcode.desc') || '超商掃碼支付' }
      ]
    }
  ];

  const handleGatewayChange = (gatewayId: string) => {
    setSelectedGateway(gatewayId);
    setSelectedMethod(''); // Reset method when gateway changes
  };

  const handleMethodSelect = (gatewayId: string, methodId: string) => {
    setSelectedMethod(methodId);
    onSelect(gatewayId, methodId);
  };

  return (
    <div className="payment-method-selector">
      <h3>{t('checkout.selectPayment')}</h3>
      
      <div className="gateway-list">
        {GATEWAYS.map((gateway) => (
          <div key={gateway.id} className="gateway-option">
            <label className="gateway-radio">
              <input
                type="radio"
                name="gateway"
                value={gateway.id}
                checked={selectedGateway === gateway.id}
                onChange={() => handleGatewayChange(gateway.id)}
              />
              <span className="gateway-name">{gateway.name}</span>
            </label>
            
            {selectedGateway === gateway.id && (
              <div className="payment-methods">
                {gateway.methods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={`payment-method-btn ${selectedMethod === method.id ? 'selected' : ''}`}
                    onClick={() => handleMethodSelect(gateway.id, method.id)}
                  >
                    <div className="method-content">
                      <span className="method-name">{method.name}</span>
                      {method.description && (
                        <span className="method-description">{method.description}</span>
                      )}
                    </div>
                    {selectedMethod === method.id && (
                      <svg 
                        className="method-check" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedGateway && !selectedMethod && (
        <div className="payment-hint">
          {t('checkout.selectPayment')}
        </div>
      )}
    </div>
  );
}

export default PaymentMethodSelector;
