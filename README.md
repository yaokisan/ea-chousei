# EA Desk

日程調整をもっとシンプルに。直感的な操作で日程調整ができるスケジューリングツール。

## 機能

### 管理者向け
- Googleアカウントでログイン
- カレンダーUIで日程候補を選択
- Googleカレンダー連携（空き時間自動抽出）
- 複数イベント管理・履歴保存
- 回答のリアルタイム集計表示
- メール通知（新しい回答があった時）
- リンクコピー・LINE共有

### ユーザー向け
- ログイン不要で回答
- アコーディオン式の直感的なUI
- ○△×の3択（△はコメント必須）
- 日付単位での一括回答
- 回答の変更可能

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **データベース**: Vercel Postgres
- **認証**: NextAuth.js (Google OAuth)
- **スタイリング**: Tailwind CSS
- **メール**: Resend
- **ホスティング**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして、必要な値を設定：

```bash
cp .env.example .env.local
```

必要な環境変数：
- `NEXTAUTH_SECRET`: ランダムな文字列（`openssl rand -base64 32` で生成）
- `GOOGLE_CLIENT_ID`: Google Cloud Console で取得
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console で取得
- `POSTGRES_*`: Vercel Postgres の接続情報
- `RESEND_API_KEY`: Resend の API キー（オプション）

### 3. Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. OAuth 同意画面を設定
3. OAuth 2.0 クライアント ID を作成
   - 承認済みのリダイレクト URI: `http://localhost:3000/api/auth/callback/google`
4. Google Calendar API を有効化

### 4. Vercel Postgres の設定

1. Vercel ダッシュボードで Storage → Create Database → Postgres
2. 環境変数を `.env.local` にコピー
3. データベースを初期化：

```bash
npm run dev
# ブラウザで http://localhost:3000/api/init にアクセス
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

## デプロイ

1. GitHub にプッシュ
2. Vercel で Import
3. 環境変数を設定（本番用の URL に更新）
4. デプロイ後に `/api/init` にアクセスしてデータベースを初期化

## ライセンス

MIT
