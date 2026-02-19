import React, { useState } from 'react';
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

const GATEWAYS: Gateway[] = [
  {
    id: 'newebpay',
    name: '蓝新金流 (NewebPay)',
    methods: [
      { id: 'credit_card', name: '信用卡', description: '支持 Visa、Mastercard、JCB' },
      { id: 'atm', name: 'ATM 转账', description: '虚拟账号转账，3天内完成' },
      { id: 'cvs', name: '超商代码', description: '7-11、全家、莱尔富' }
    ]
  },
  {
    id: 'ecpay',
    name: '绿界科技 (ECPay)',
    methods: [
      { id: 'credit_card', name: '信用卡', description: '支持 Visa、Mastercard、JCB' },
      { id: 'atm', name: 'ATM 转账', description: '虚拟账号转账，3天内完成' },
      { id: 'cvs', name: '超商代码', description: '7-11、全家、莱尔富、OK' },
      { id: 'barcode', name: '超商条码', description: '超商扫码支付' }
    ]
  }
];

export function PaymentMethodSelector({ onSelect }: PaymentMethodSelectorProps) {
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

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
      <h3>选择支付方式</h3>
      
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
          请选择一个支付方式以继续
        </div>
      )}
    </div>
  );
}

export default PaymentMethodSelector;
