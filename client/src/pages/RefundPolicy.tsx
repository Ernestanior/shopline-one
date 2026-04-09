import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Policy.css';

const RefundPolicy: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-content">
          {language === 'zh-TW' ? (
            <>
              <h1>退款政策</h1>
              <p className="policy-date">最後更新日期：2024年1月</p>

              <section>
                <h2>1. 數位產品退款政策</h2>
                <p>
                  由於我們銷售的是數位產品（電子書和學習資源），一旦產品被下載或訪問，
                  我們通常無法提供退款。但是，我們理解某些情況下可能需要退款。
                </p>
              </section>

              <section>
                <h2>2. 符合退款條件的情況</h2>
                <p>在以下情況下，您可能有資格獲得退款：</p>
                <ul>
                  <li>技術問題：如果您無法下載或訪問購買的產品，且我們無法在48小時內解決問題</li>
                  <li>重複購買：如果您意外購買了同一產品兩次</li>
                  <li>產品描述錯誤：如果產品與描述嚴重不符</li>
                  <li>未經授權的購買：如果您的帳戶被未經授權使用進行購買</li>
                </ul>
              </section>

              <section>
                <h2>3. 退款時間限制</h2>
                <p>
                  退款請求必須在購買後 <strong>7天內</strong> 提出。超過此期限的請求將不予受理，除非有特殊情況。
                </p>
              </section>

              <section>
                <h2>4. 不符合退款條件的情況</h2>
                <p>以下情況不符合退款條件：</p>
                <ul>
                  <li>您已經下載並閱讀了電子書的大部分內容</li>
                  <li>您改變主意或不喜歡內容風格</li>
                  <li>您購買了錯誤的產品但已經下載</li>
                  <li>您的設備不兼容（請在購買前檢查系統要求）</li>
                  <li>您違反了我們的服務條款</li>
                </ul>
              </section>

              <section>
                <h2>5. 如何申請退款</h2>
                <p>要申請退款，請按照以下步驟操作：</p>
                <ol>
                  <li>通過電子郵件聯繫我們的客戶支持：ern@xyvnai.com</li>
                  <li>在主題行中註明"退款請求"</li>
                  <li>提供以下資訊：
                    <ul>
                      <li>訂單號</li>
                      <li>購買日期</li>
                      <li>產品名稱</li>
                      <li>退款原因的詳細說明</li>
                      <li>任何支持文件（如適用）</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h2>6. 退款處理時間</h2>
                <p>
                  一旦您的退款請求獲得批准：
                </p>
                <ul>
                  <li>我們將在 3-5 個工作日內處理退款</li>
                  <li>退款將退回到原始付款方式</li>
                  <li>根據您的銀行或信用卡公司，可能需要額外的 5-10 個工作日才能在您的帳戶中顯示</li>
                </ul>
              </section>

              <section>
                <h2>7. 部分退款</h2>
                <p>
                  在某些情況下，我們可能會提供部分退款，例如：
                </p>
                <ul>
                  <li>產品有輕微缺陷但仍可使用</li>
                  <li>您已經訪問了部分內容</li>
                  <li>其他特殊情況由我們自行決定</li>
                </ul>
              </section>

              <section>
                <h2>8. 促銷和折扣</h2>
                <p>
                  使用促銷代碼或折扣購買的產品，退款金額將是實際支付的金額，而不是原價。
                </p>
              </section>

              <section>
                <h2>9. 訂閱和會員資格</h2>
                <p>
                  如果我們提供訂閱服務：
                </p>
                <ul>
                  <li>您可以隨時取消訂閱</li>
                  <li>取消後，您將繼續訪問服務直到當前計費週期結束</li>
                  <li>不提供按比例退款</li>
                  <li>如果在試用期內取消，將不收取費用</li>
                </ul>
              </section>

              <section>
                <h2>10. 退款後的訪問權限</h2>
                <p>
                  一旦退款處理完成，您將失去對退款產品的訪問權限。
                  請確保在申請退款前刪除所有下載的副本。
                </p>
              </section>

              <section>
                <h2>11. 爭議解決</h2>
                <p>
                  如果您對退款決定不滿意，您可以：
                </p>
                <ul>
                  <li>要求與主管進行審查</li>
                  <li>提供額外的資訊或文件</li>
                  <li>通過您的付款提供商提出爭議（作為最後手段）</li>
                </ul>
              </section>

              <section>
                <h2>12. 政策變更</h2>
                <p>
                  我們保留隨時修改此退款政策的權利。任何變更將在本頁面上發布。
                  繼續使用我們的服務即表示您接受修改後的政策。
                </p>
              </section>

              <section>
                <h2>13. 聯繫我們</h2>
                <p>如果您對我們的退款政策有任何疑問或需要幫助，請聯繫我們：</p>
                <p>
                  電子郵件：ern@xyvnai.com<br />
                  營業時間：週一至週五，上午 9:00 - 下午 6:00 (GMT+8)
                </p>
                <p>
                  我們致力於確保您對購買感到滿意，並將盡力解決任何問題。
                </p>
              </section>
            </>
          ) : (
            <>
              <h1>Refund Policy</h1>
              <p className="policy-date">Last Updated: January 2024</p>

              <section>
                <h2>1. Digital Product Refund Policy</h2>
                <p>
                  As we sell digital products (e-books and learning resources), we generally cannot offer refunds once a product has been downloaded or accessed. However, we understand that certain situations may warrant a refund.
                </p>
              </section>

              <section>
                <h2>2. Eligible Refund Situations</h2>
                <p>You may be eligible for a refund in the following cases:</p>
                <ul>
                  <li>Technical Issues: If you cannot download or access the purchased product and we cannot resolve the issue within 48 hours</li>
                  <li>Duplicate Purchase: If you accidentally purchased the same product twice</li>
                  <li>Product Description Error: If the product significantly differs from its description</li>
                  <li>Unauthorized Purchase: If your account was used without authorization to make a purchase</li>
                </ul>
              </section>

              <section>
                <h2>3. Refund Time Limit</h2>
                <p>
                  Refund requests must be submitted within <strong>7 days</strong> of purchase. Requests beyond this period will not be accepted unless there are exceptional circumstances.
                </p>
              </section>

              <section>
                <h2>4. Non-Eligible Refund Situations</h2>
                <p>The following situations are not eligible for refunds:</p>
                <ul>
                  <li>You have already downloaded and read most of the e-book content</li>
                  <li>You changed your mind or dislike the content style</li>
                  <li>You purchased the wrong product but have already downloaded it</li>
                  <li>Your device is incompatible (please check system requirements before purchase)</li>
                  <li>You violated our Terms of Service</li>
                </ul>
              </section>

              <section>
                <h2>5. How to Request a Refund</h2>
                <p>To request a refund, follow these steps:</p>
                <ol>
                  <li>Contact our customer support via email: ern@xyvnai.com</li>
                  <li>Include "Refund Request" in the subject line</li>
                  <li>Provide the following information:
                    <ul>
                      <li>Order number</li>
                      <li>Purchase date</li>
                      <li>Product name</li>
                      <li>Detailed explanation of the reason for refund</li>
                      <li>Any supporting documentation (if applicable)</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h2>6. Refund Processing Time</h2>
                <p>
                  Once your refund request is approved:
                </p>
                <ul>
                  <li>We will process the refund within 3-5 business days</li>
                  <li>The refund will be returned to the original payment method</li>
                  <li>Depending on your bank or credit card company, it may take an additional 5-10 business days to appear in your account</li>
                </ul>
              </section>

              <section>
                <h2>7. Partial Refunds</h2>
                <p>
                  In some cases, we may offer a partial refund, such as:
                </p>
                <ul>
                  <li>The product has minor defects but is still usable</li>
                  <li>You have already accessed part of the content</li>
                  <li>Other special circumstances at our discretion</li>
                </ul>
              </section>

              <section>
                <h2>8. Promotions and Discounts</h2>
                <p>
                  For products purchased using promotional codes or discounts, the refund amount will be the actual amount paid, not the original price.
                </p>
              </section>

              <section>
                <h2>9. Subscriptions and Memberships</h2>
                <p>
                  If we offer subscription services:
                </p>
                <ul>
                  <li>You can cancel your subscription at any time</li>
                  <li>After cancellation, you will continue to have access until the end of the current billing period</li>
                  <li>No prorated refunds are provided</li>
                  <li>If canceled during a trial period, no charges will be made</li>
                </ul>
              </section>

              <section>
                <h2>10. Access Rights After Refund</h2>
                <p>
                  Once a refund is processed, you will lose access to the refunded product. Please ensure you delete all downloaded copies before requesting a refund.
                </p>
              </section>

              <section>
                <h2>11. Dispute Resolution</h2>
                <p>
                  If you are not satisfied with a refund decision, you may:
                </p>
                <ul>
                  <li>Request a review with a supervisor</li>
                  <li>Provide additional information or documentation</li>
                  <li>File a dispute through your payment provider (as a last resort)</li>
                </ul>
              </section>

              <section>
                <h2>12. Policy Changes</h2>
                <p>
                  We reserve the right to modify this refund policy at any time. Any changes will be posted on this page. Continued use of our services constitutes acceptance of the modified policy.
                </p>
              </section>

              <section>
                <h2>13. Contact Us</h2>
                <p>If you have questions about our refund policy or need assistance, please contact us:</p>
                <p>
                  Email: ern@xyvnai.com<br />
                  Hours: Monday-Friday, 9:00 AM - 6:00 PM (GMT+8)
                </p>
                <p>
                  We are committed to ensuring your satisfaction with your purchase and will do our best to resolve any issues.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
