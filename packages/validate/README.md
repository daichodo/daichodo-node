# @daichodo/validate

法人番号と適格請求書発行事業者の登録番号を検証します。依存関係なし、通信なし、APIキー不要。

Validate Japanese corporate numbers (法人番号) and qualified invoice
registration numbers (登録番号). Zero dependencies, no network, no API key.

```bash
npm install @daichodo/validate
```

```ts
import { validateRegistrationNumber } from '@daichodo/validate';

validateRegistrationNumber('T1010001153225');
// { value: 'T1010001153225', valid: true, corporateNumber: '1010001153225' }
```

## 日本語

検査用数字の計算式は国税庁が公表している仕様に基づくため、サービスへの接続は不要です。

判定できるのは**形式として正しいか**であり、**実際に登録されているか**ではありません。
登録の有無や有効期間を確認するには [daichodo.com](https://daichodo.com) の API を
ご利用ください。

### 個人事業主の登録番号に検査用数字はありません

個人事業主の登録番号は法人番号から導出されないため、形式以外に検証できる要素が
ありません。

```ts
validateRegistrationNumber('T1234567890123');
// { valid: true, reason: 'not derived from a 法人番号' }
```

これらは**有効**です。登録簿の約半数は個人事業主であるため、無効として扱うと確認対象の
半分を誤って弾くことになります。

## English

The check-digit rules come from the National Tax Agency's published
specification, so this needs no service behind it.

It tells you whether a number is **well-formed** — not whether it is
**registered**. For registration status and validity dates you need the API at
[daichodo.com](https://daichodo.com).

### Sole traders have no check digit

Registration numbers for sole traders are not derived from a 法人番号, so there
is nothing to verify beyond the format. They are **valid**. Roughly half the
register is sole traders, so treating them as invalid would reject half of
everything you look at.

## ライセンス / Licence

MIT.

---

出典：国税庁法人番号公表サイト（国税庁）（https://www.houjin-bangou.nta.go.jp/）を加工して作成
