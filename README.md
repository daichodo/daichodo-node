# daichodo-node

Daichodo（台帳堂）の TypeScript パッケージ。適格請求書発行事業者（インボイス）
登録番号と法人番号のデータを扱います。

TypeScript packages for [Daichodo](https://daichodo.com) — Japanese qualified
invoice issuer (適格請求書発行事業者) and corporate number (法人番号) data.

| パッケージ / Package | 内容 / What it is | APIキー / Needs a key |
| --- | --- | --- |
| [`@daichodo/validate`](packages/validate) | 形式・検査用数字の検証。依存関係なし、通信なし。<br>Format and check-digit validation. Zero dependencies, no network. | 不要 / No |
| [`daichodo`](packages/daichodo) | Daichodo API クライアント。<br>Client for the Daichodo API. | 必要 / Yes |

---

## 日本語

### 登録不要で検証する

```bash
npm install @daichodo/validate
```

```ts
import { validateRegistrationNumber } from '@daichodo/validate';

validateRegistrationNumber('T1010001153225');
// { value: 'T1010001153225', valid: true, corporateNumber: '1010001153225' }
```

検査用数字の計算式は国税庁が公表している仕様に基づくため、サービスへの接続は不要です。
判定できるのは**形式として正しいか**であり、**実際に登録されているか**ではありません。

### 個人事業主の登録番号に検査用数字はありません

個人事業主の登録番号は法人番号から導出されないため、形式以外に検証できる要素が
ありません。

```ts
validateRegistrationNumber('T1234567890123');
// { valid: true, reason: 'not derived from a 法人番号' }
```

これらは**有効**です。登録簿の約半数は個人事業主であるため、無効として扱うと確認対象の
半分を誤って弾くことになります。

### 登録簿を照会する

```bash
npm install daichodo
```

```ts
import { createClient } from '@hey-api/client-fetch';
import { getInvoiceIssuer } from 'daichodo';

createClient({
  baseUrl: 'https://api.daichodo.com',
  headers: { Authorization: `Bearer ${process.env.DAICHODO_API_KEY}` },
});

const { data } = await getInvoiceIssuer({
  path: { registration_number: 'T1010001153225' },
});
```

### `name` が null でもエラーではありません

国税庁は個人事業主の氏名・住所を公表データから除外しています。そのため個人事業主の
レコードは、登録年月日などの日付は保持したまま**氏名が null** で返ります。

レコードは存在し、日付は正確です。`name === null` を「該当なし」と解釈することが最も
多い誤りで、登録簿の約半数を無言で切り捨てることになります。

### テストモード

`dc_test_` で始まるキーは固定データセットを参照します。登録簿の更新によって
インテグレーションテストが壊れることはありません。有効な法人、氏名のない個人事業主、
失効した登録、取消された登録、外字を含む法人が含まれます。

---

## English

### Validate without signing up for anything

```bash
npm install @daichodo/validate
```

```ts
import { validateRegistrationNumber } from '@daichodo/validate';

validateRegistrationNumber('T1010001153225');
// { value: 'T1010001153225', valid: true, corporateNumber: '1010001153225' }
```

The check-digit rules come from the National Tax Agency's published
specification, so this needs no service behind it. It tells you whether a number
is **well-formed** — not whether it is **registered**. For that you need a
lookup.

### Sole traders have no check digit

Registration numbers for sole traders (個人事業主) are not derived from a
法人番号, so there is nothing to verify beyond the format:

```ts
validateRegistrationNumber('T1234567890123');
// { value: 'T1234567890123', valid: true, reason: 'not derived from a 法人番号' }
```

These are **valid**. Roughly half the register is sole traders, so treating them
as invalid would reject half of everything you look at.

## Look up the register

```bash
npm install daichodo
```

```ts
import { createClient } from '@hey-api/client-fetch';
import { getInvoiceIssuer } from 'daichodo';

createClient({
  baseUrl: 'https://api.daichodo.com',
  headers: { Authorization: `Bearer ${process.env.DAICHODO_API_KEY}` },
});

const { data } = await getInvoiceIssuer({
  path: { registration_number: 'T1010001153225' },
});
```

### `name` is null for sole traders, and that is not an error

The NTA strips identity fields for individuals at source. A sole trader returns
their registration and validity dates with **no name**:

```ts
// { registration_number: 'T…', kind: 'individual', name: null,
//   registration_date: '2023-10-01', … }
```

The record exists and its dates are authoritative. Treating `name === null` as
"not found" is the most common way to get this wrong, and it silently discards
about half the register.

## Test mode

Keys beginning `dc_test_` read a frozen dataset that never changes, so your
integration tests do not break when the registry moves. It includes an active
corporation, a sole trader with no name, a lapsed registration, a revoked one,
and a company whose name the NTA could not represent.

---

## 生成コードについて / This code is generated

`packages/daichodo` は API の OpenAPI スキーマから自動生成され、リリースごとに
上書きされます。**プルリクエストは受け付けられません**（次回生成時に失われます）。
不具合は Issue でご報告ください。`packages/validate` は手書きのため
プルリクエストを歓迎します。

`packages/daichodo` is generated from the API's OpenAPI schema and pushed here
automatically. **Pull requests against it cannot be accepted** — they are lost on
the next release, and CI rejects them. Open an issue instead. `packages/validate`
is hand-written and pull requests are welcome.

## ライセンス / Licence

MIT.

---

出典：国税庁適格請求書発行事業者公表サイト（国税庁）（https://www.invoice-kohyo.nta.go.jp/）を加工して作成
出典：国税庁法人番号公表サイト（国税庁）（https://www.houjin-bangou.nta.go.jp/）を加工して作成
