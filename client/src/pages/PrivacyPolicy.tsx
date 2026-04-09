import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Policy.css';

const PrivacyPolicy: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-content">
          {language === 'zh-TW' ? (
            <>
              <h1>隱私政策</h1>
              <p className="policy-date">最後更新日期：2024年1月</p>

              <section>
                <h2>1. 簡介</h2>
                <p>
                  ARVIX（"我們"、"我們的"）重視您的隱私。本隱私政策說明我們如何收集、使用、披露和保護您在使用我們的網站和服務時提供的資訊。
                </p>
              </section>

              <section>
                <h2>2. 我們收集的資訊</h2>
                <h3>2.1 個人資訊</h3>
                <p>當您在我們的網站上註冊、下訂單或訂閱我們的電子報時，我們可能會收集以下資訊：</p>
                <ul>
                  <li>姓名</li>
                  <li>電子郵件地址</li>
                  <li>送貨地址</li>
                  <li>電話號碼</li>
                  <li>付款資訊（通過安全的第三方支付處理器處理）</li>
                </ul>

                <h3>2.2 自動收集的資訊</h3>
                <p>我們可能會自動收集以下資訊：</p>
                <ul>
                  <li>IP 地址</li>
                  <li>瀏覽器類型和版本</li>
                  <li>設備資訊</li>
                  <li>訪問時間和日期</li>
                  <li>瀏覽的頁面</li>
                  <li>Cookie 和類似技術</li>
                </ul>
              </section>

              <section>
                <h2>3. 我們如何使用您的資訊</h2>
                <p>我們使用收集的資訊用於：</p>
                <ul>
                  <li>處理和完成您的訂單</li>
                  <li>向您發送訂單確認和更新</li>
                  <li>提供客戶支持</li>
                  <li>改善我們的網站和服務</li>
                  <li>發送促銷電子郵件（如果您選擇接收）</li>
                  <li>防止欺詐和確保安全</li>
                  <li>遵守法律義務</li>
                </ul>
              </section>

              <section>
                <h2>4. 資訊共享</h2>
                <p>我們不會出售、交易或出租您的個人資訊給第三方。我們可能會在以下情況下共享您的資訊：</p>
                <ul>
                  <li>與服務提供商（如支付處理器、運輸公司）共享以完成您的訂單</li>
                  <li>遵守法律要求或回應法律程序</li>
                  <li>保護我們的權利、財產或安全</li>
                  <li>在業務轉讓或合併的情況下</li>
                </ul>
              </section>

              <section>
                <h2>5. 數據安全</h2>
                <p>
                  我們採取合理的技術和組織措施來保護您的個人資訊免受未經授權的訪問、使用、披露或破壞。
                  然而，沒有任何互聯網傳輸或電子存儲方法是100%安全的。
                </p>
              </section>

              <section>
                <h2>6. Cookie</h2>
                <p>
                  我們使用 Cookie 和類似技術來改善您的瀏覽體驗、分析網站流量並個性化內容。
                  您可以通過瀏覽器設置控制 Cookie 的使用，但這可能會影響網站的某些功能。
                </p>
              </section>

              <section>
                <h2>7. 您的權利</h2>
                <p>您有權：</p>
                <ul>
                  <li>訪問我們持有的關於您的個人資訊</li>
                  <li>要求更正不準確的資訊</li>
                  <li>要求刪除您的個人資訊</li>
                  <li>反對或限制處理您的資訊</li>
                  <li>數據可攜性</li>
                  <li>隨時撤回同意</li>
                </ul>
                <p>要行使這些權利，請通過 ern@xyvnai.com 聯繫我們。</p>
              </section>

              <section>
                <h2>8. 第三方鏈接</h2>
                <p>
                  我們的網站可能包含指向第三方網站的鏈接。我們不對這些網站的隱私做法負責。
                  我們建議您查看您訪問的任何第三方網站的隱私政策。
                </p>
              </section>

              <section>
                <h2>9. 兒童隱私</h2>
                <p>
                  我們的服務不針對13歲以下的兒童。我們不會故意收集13歲以下兒童的個人資訊。
                  如果您認為我們可能擁有來自13歲以下兒童的資訊，請聯繫我們。
                </p>
              </section>

              <section>
                <h2>10. 政策變更</h2>
                <p>
                  我們可能會不時更新本隱私政策。任何變更將在本頁面上發布，並註明"最後更新日期"。
                  我們建議您定期查看本政策以了解任何變更。
                </p>
              </section>

              <section>
                <h2>11. 聯繫我們</h2>
                <p>如果您對本隱私政策有任何疑問或疑慮，請通過以下方式聯繫我們：</p>
                <p>
                  電子郵件：ern@xyvnai.com<br />
                  營業時間：週一至週五，上午 9:00 - 下午 6:00 (GMT+8)
                </p>
              </section>
            </>
          ) : (
            <>
              <h1>Privacy Policy</h1>
              <p className="policy-date">Last Updated: January 2024</p>

              <section>
                <h2>1. Introduction</h2>
                <p>
                  ARVIX ("we," "our," or "us") values your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our website and services.
                </p>
              </section>

              <section>
                <h2>2. Information We Collect</h2>
                <h3>2.1 Personal Information</h3>
                <p>When you register, place an order, or subscribe to our newsletter, we may collect:</p>
                <ul>
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Shipping address</li>
                  <li>Phone number</li>
                  <li>Payment information (processed through secure third-party payment processors)</li>
                </ul>

                <h3>2.2 Automatically Collected Information</h3>
                <p>We may automatically collect:</p>
                <ul>
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Access times and dates</li>
                  <li>Pages viewed</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </section>

              <section>
                <h2>3. How We Use Your Information</h2>
                <p>We use collected information to:</p>
                <ul>
                  <li>Process and fulfill your orders</li>
                  <li>Send order confirmations and updates</li>
                  <li>Provide customer support</li>
                  <li>Improve our website and services</li>
                  <li>Send promotional emails (if you opt-in)</li>
                  <li>Prevent fraud and ensure security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2>4. Information Sharing</h2>
                <p>We do not sell, trade, or rent your personal information to third parties. We may share your information:</p>
                <ul>
                  <li>With service providers (payment processors, shipping companies) to fulfill your orders</li>
                  <li>To comply with legal requirements or respond to legal processes</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>In the event of a business transfer or merger</li>
                </ul>
              </section>

              <section>
                <h2>5. Data Security</h2>
                <p>
                  We implement reasonable technical and organizational measures to protect your personal information from unauthorized access, use, disclosure, or destruction. However, no method of internet transmission or electronic storage is 100% secure.
                </p>
              </section>

              <section>
                <h2>6. Cookies</h2>
                <p>
                  We use cookies and similar technologies to improve your browsing experience, analyze site traffic, and personalize content. You can control cookie usage through your browser settings, though this may affect certain website features.
                </p>
              </section>

              <section>
                <h2>7. Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                  <li>Access personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Object to or restrict processing of your information</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <p>To exercise these rights, contact us at ern@xyvnai.com.</p>
              </section>

              <section>
                <h2>8. Third-Party Links</h2>
                <p>
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </section>

              <section>
                <h2>9. Children's Privacy</h2>
                <p>
                  Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we may have information from a child under 13, please contact us.
                </p>
              </section>

              <section>
                <h2>10. Policy Changes</h2>
                <p>
                  We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2>11. Contact Us</h2>
                <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
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

export default PrivacyPolicy;
