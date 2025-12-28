// デバッグ用の簡単なテストスクリプト
console.log('=== 手動テスト手順 ===');
console.log('1. http://localhost:5175/ をブラウザで開く');
console.log('2. F12でデベロッパーツールを開く');
console.log('3. コンソールタブを選択');
console.log('4. 以下の操作を実行:');
console.log('   - 「新しい科目を追加」をクリック');
console.log('   - 科目名に「数学」と入力して「追加」をクリック');
console.log('   - 「テストを追加」をクリック'); 
console.log('   - テスト名に「中間テスト」、得点に「85」を入力');
console.log('   - 「追加」をクリック');
console.log('5. コンソールのログを確認して以下をチェック:');
console.log('   - "Form data before validation:" でテスト名が正しく表示されるか');
console.log('   - "Adding test:" でテストオブジェクトが作成されるか');
console.log('   - "CurrentTestsTable received tests:" でテスト配列が空でないか');
console.log('6. テーブルに「実施済みテストがありません」と表示されるかチェック');
