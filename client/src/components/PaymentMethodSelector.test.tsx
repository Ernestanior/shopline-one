import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentMethodSelector from './PaymentMethodSelector';

describe('PaymentMethodSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  test('renders gateway options', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    expect(screen.getByText('蓝新金流 (NewebPay)')).toBeInTheDocument();
    expect(screen.getByText('绿界科技 (ECPay)')).toBeInTheDocument();
  });

  test('displays payment methods when gateway is selected', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    // Initially, payment methods should not be visible
    expect(screen.queryByText('信用卡')).not.toBeInTheDocument();
    
    // Select NewebPay gateway
    const newebpayRadio = screen.getByLabelText('蓝新金流 (NewebPay)');
    fireEvent.click(newebpayRadio);
    
    // Payment methods should now be visible
    expect(screen.getAllByText('信用卡')[0]).toBeInTheDocument();
    expect(screen.getByText('ATM 转账')).toBeInTheDocument();
    expect(screen.getByText('超商代码')).toBeInTheDocument();
  });

  test('displays correct payment methods for NewebPay', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    const newebpayRadio = screen.getByLabelText('蓝新金流 (NewebPay)');
    fireEvent.click(newebpayRadio);
    
    // NewebPay should have 3 methods
    const creditCardButtons = screen.getAllByText('信用卡');
    expect(creditCardButtons.length).toBeGreaterThan(0);
    expect(screen.getByText('ATM 转账')).toBeInTheDocument();
    expect(screen.getByText('超商代码')).toBeInTheDocument();
    
    // Should not have barcode (ECPay only)
    expect(screen.queryByText('超商条码')).not.toBeInTheDocument();
  });

  test('displays correct payment methods for ECPay', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    const ecpayRadio = screen.getByLabelText('绿界科技 (ECPay)');
    fireEvent.click(ecpayRadio);
    
    // ECPay should have 4 methods including barcode
    expect(screen.getAllByText('信用卡')[0]).toBeInTheDocument();
    expect(screen.getByText('ATM 转账')).toBeInTheDocument();
    expect(screen.getByText('超商代码')).toBeInTheDocument();
    expect(screen.getByText('超商条码')).toBeInTheDocument();
  });

  test('calls onSelect when payment method is selected', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    // Select NewebPay gateway
    const newebpayRadio = screen.getByLabelText('蓝新金流 (NewebPay)');
    fireEvent.click(newebpayRadio);
    
    // Select credit card method
    const creditCardButton = screen.getAllByText('信用卡')[0].closest('button');
    fireEvent.click(creditCardButton!);
    
    expect(mockOnSelect).toHaveBeenCalledWith('newebpay', 'credit_card');
  });

  test('resets payment method when gateway changes', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    // Select NewebPay and a payment method
    const newebpayRadio = screen.getByLabelText('蓝新金流 (NewebPay)');
    fireEvent.click(newebpayRadio);
    
    const creditCardButton = screen.getAllByText('信用卡')[0].closest('button');
    fireEvent.click(creditCardButton!);
    
    expect(creditCardButton).toHaveClass('selected');
    
    // Switch to ECPay
    const ecpayRadio = screen.getByLabelText('绿界科技 (ECPay)');
    fireEvent.click(ecpayRadio);
    
    // Previous selection should be cleared
    const newCreditCardButton = screen.getAllByText('信用卡')[0].closest('button');
    expect(newCreditCardButton).not.toHaveClass('selected');
  });

  test('highlights selected payment method', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    const newebpayRadio = screen.getByLabelText('蓝新金流 (NewebPay)');
    fireEvent.click(newebpayRadio);
    
    const atmButton = screen.getByText('ATM 转账').closest('button');
    fireEvent.click(atmButton!);
    
    expect(atmButton).toHaveClass('selected');
  });

  test('shows hint when gateway is selected but no method chosen', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    const newebpayRadio = screen.getByLabelText('蓝新金流 (NewebPay)');
    fireEvent.click(newebpayRadio);
    
    expect(screen.getByText('请选择一个支付方式以继续')).toBeInTheDocument();
  });

  test('hides hint when payment method is selected', () => {
    render(<PaymentMethodSelector onSelect={mockOnSelect} />);
    
    const newebpayRadio = screen.getByLabelText('蓝新金流 (NewebPay)');
    fireEvent.click(newebpayRadio);
    
    expect(screen.getByText('请选择一个支付方式以继续')).toBeInTheDocument();
    
    const creditCardButton = screen.getAllByText('信用卡')[0].closest('button');
    fireEvent.click(creditCardButton!);
    
    expect(screen.queryByText('请选择一个支付方式以继续')).not.toBeInTheDocument();
  });
});
