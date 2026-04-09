import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Policy.css';

const TermsOfService: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-content">
          {language === 'zh-TW' ? (
            <>
              <h1>服務條款</h1>
              <p className="policy-date">最後更新日期：2024年1月</p>

              <section>
                <h2>1. 接受條款</h2>
                <p>
                  歡迎使用 ARVIX。通過訪問或使用我們的網站和服務，您同意受這些服務條款的約束。
                  如果您不同意這些條款，請不要使用我們的服務。
                </p>
              </section>

              <section>
                <h2>2. 服務描述</h2>
                <p>
                  ARVIX 提供技術教育電子書和數位學習資源的在線平台。我們保留隨時修改、暫停或終止服務的任何部分的權利，恕不另行通知。
                </p>
              </section>

              <section>
                <h2>3. 用戶帳戶</h2>
                <h3>3.1 註冊</h3>
                <p>
                  要訪問某些功能，您可能需要創建帳戶。您同意提供準確、完整和最新的資訊。
                </p>

                <h3>3.2 帳戶安全</h3>
                <p>
                  您負責維護帳戶憑證的機密性，並對您帳戶下發生的所有活動負責。
                  如果您懷疑未經授權使用您的帳戶，請立即通知我們。
                </p>

                <h3>3.3 帳戶終止</h3>
                <p>
                  我們保留隨時暫停或終止違反這些條款的帳戶的權利，恕不另行通知。
                </p>
              </section>

              <section>
                <h2>4. 購買和付款</h2>
                <h3>4.1 定價</h3>
                <p>
                  所有價格均以新台幣（TWD）或美元（USD）顯示，並可能隨時更改。我們努力確保定價準確，但錯誤可能會發生。
                </p>

                <h3>4.2 付款</h3>
                <p>
                  我們接受主要信用卡和其他指定的付款方式。通過下訂單，您授權我們向您的付款方式收取總金額。
                </p>

                <h3>4.3 訂單確認</h3>
                <p>
                  收到您的訂單後，我們將發送確認電子郵件。此確認不構成我們接受您的訂單。
                  我們保留拒絕或取消任何訂單的權利。
                </p>
              </section>

              <section>
                <h2>5. 數位產品交付</h2>
                <p>
                  購買的電子書和數位內容將通過電子郵件或帳戶下載鏈接交付。
                  交付時間通常為付款確認後立即或24小時內。
                </p>
              </section>

              <section>
                <h2>6. 知識產權</h2>
                <h3>6.1 所有權</h3>
                <p>
                  我們網站上的所有內容，包括但不限於文本、圖形、標誌、圖像和軟件，均為 ARVIX 或其內容供應商的財產，
                  並受版權、商標和其他知識產權法的保護。
                </p>

                <h3>6.2 許可</h3>
                <p>
                  購買電子書後，您將獲得個人、非商業使用的有限、不可轉讓的許可。
                  您不得複製、分發、修改或創建衍生作品。
                </p>
              </section>

              <section>
                <h2>7. 用戶行為</h2>
                <p>您同意不會：</p>
                <ul>
                  <li>違反任何適用的法律或法規</li>
                  <li>侵犯他人的權利</li>
                  <li>上傳病毒或惡意代碼</li>
                  <li>試圖未經授權訪問我們的系統</li>
                  <li>干擾或破壞服務</li>
                  <li>使用自動化工具抓取或收集數據</li>
                  <li>冒充他人或虛假陳述您的身份</li>
                </ul>
              </section>

              <section>
                <h2>8. 免責聲明</h2>
                <p>
                  我們的服務按"原樣"和"可用"基礎提供，不提供任何明示或暗示的保證。
                  我們不保證服務將不間斷、安全或無錯誤。
                </p>
              </section>

              <section>
                <h2>9. 責任限制</h2>
                <p>
                  在法律允許的最大範圍內，ARVIX 不對任何間接、偶然、特殊、後果性或懲罰性損害負責，
                  包括但不限於利潤損失、數據丟失或業務中斷。
                </p>
              </section>

              <section>
                <h2>10. 賠償</h2>
                <p>
                  您同意賠償並使 ARVIX 及其關聯公司、高級職員、代理人和員工免受因您違反這些條款或使用服務而產生的任何索賠、損害、義務、損失、責任、成本或債務以及費用的損害。
                </p>
              </section>

              <section>
                <h2>11. 爭議解決</h2>
                <p>
                  這些條款受台灣法律管轄。任何爭議應首先通過友好協商解決。
                  如果無法解決，爭議將提交台灣有管轄權的法院。
                </p>
              </section>

              <section>
                <h2>12. 條款變更</h2>
                <p>
                  我們保留隨時修改這些條款的權利。變更將在本頁面上發布，並註明"最後更新日期"。
                  繼續使用服務即表示您接受修改後的條款。
                </p>
              </section>

              <section>
                <h2>13. 聯繫我們</h2>
                <p>如果您對這些服務條款有任何疑問，請聯繫我們：</p>
                <p>
                  電子郵件：ern@xyvnai.com<br />
                  營業時間：週一至週五，上午 9:00 - 下午 6:00 (GMT+8)
                </p>
              </section>
            </>
          ) : (
            <>
              <h1>Terms of Service</h1>
              <p className="policy-date">Last Updated: January 2024</p>

              <section>
                <h2>1. Acceptance of Terms</h2>
                <p>
                  Welcome to ARVIX. By accessing or using our website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2>2. Service Description</h2>
                <p>
                  ARVIX provides an online platform for technical education e-books and digital learning resources. We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice.
                </p>
              </section>

              <section>
                <h2>3. User Accounts</h2>
                <h3>3.1 Registration</h3>
                <p>
                  To access certain features, you may need to create an account. You agree to provide accurate, complete, and current information.
                </p>

                <h3>3.2 Account Security</h3>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately if you suspect unauthorized use of your account.
                </p>

                <h3>3.3 Account Termination</h3>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these terms at any time without notice.
                </p>
              </section>

              <section>
                <h2>4. Purchases and Payment</h2>
                <h3>4.1 Pricing</h3>
                <p>
                  All prices are displayed in TWD or USD and are subject to change without notice. We strive for pricing accuracy, but errors may occur.
                </p>

                <h3>4.2 Payment</h3>
                <p>
                  We accept major credit cards and other specified payment methods. By placing an order, you authorize us to charge your payment method for the total amount.
                </p>

                <h3>4.3 Order Confirmation</h3>
                <p>
                  Upon receiving your order, we will send a confirmation email. This confirmation does not constitute our acceptance of your order. We reserve the right to refuse or cancel any order.
                </p>
              </section>

              <section>
                <h2>5. Digital Product Delivery</h2>
                <p>
                  Purchased e-books and digital content will be delivered via email or account download link. Delivery typically occurs immediately or within 24 hours of payment confirmation.
                </p>
              </section>

              <section>
                <h2>6. Intellectual Property</h2>
                <h3>6.1 Ownership</h3>
                <p>
                  All content on our website, including but not limited to text, graphics, logos, images, and software, is the property of ARVIX or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3>6.2 License</h3>
                <p>
                  Upon purchasing an e-book, you receive a limited, non-transferable license for personal, non-commercial use. You may not copy, distribute, modify, or create derivative works.
                </p>
              </section>

              <section>
                <h2>7. User Conduct</h2>
                <p>You agree not to:</p>
                <ul>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Upload viruses or malicious code</li>
                  <li>Attempt unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Use automated tools to scrape or collect data</li>
                  <li>Impersonate others or misrepresent your identity</li>
                </ul>
              </section>

              <section>
                <h2>8. Disclaimers</h2>
                <p>
                  Our services are provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
                </p>
              </section>

              <section>
                <h2>9. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, ARVIX shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business interruption.
                </p>
              </section>

              <section>
                <h2>10. Indemnification</h2>
                <p>
                  You agree to indemnify and hold ARVIX and its affiliates, officers, agents, and employees harmless from any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses arising from your breach of these terms or use of the service.
                </p>
              </section>

              <section>
                <h2>11. Dispute Resolution</h2>
                <p>
                  These terms are governed by the laws of Taiwan. Any disputes should first be resolved through friendly negotiation. If unresolved, disputes will be submitted to courts of competent jurisdiction in Taiwan.
                </p>
              </section>

              <section>
                <h2>12. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of the service constitutes acceptance of modified terms.
                </p>
              </section>

              <section>
                <h2>13. Contact Us</h2>
                <p>If you have questions about these Terms of Service, please contact us:</p>
                <p>
                  Email: ern@xyvnai.com<br />
                  Hours: Monday-Friday, 9:00 AM - 6:00 PM (GMT+8)
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
