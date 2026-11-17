package com.hanidayo.familyboard;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.Color;
import android.net.Uri;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.*;
import java.net.URI;

/** Small native display shell. Data and management remain on the user's Ubuntu server. */
public class MainActivity extends Activity {
    private WebView web;
    private String base = "";
    private ValueCallback<Uri[]> files;
    private final Handler timer = new Handler(Looper.getMainLooper());
    private final Runnable displayTick = new Runnable() {
        public void run() {
            if (web != null && sameOrigin(web.getUrl())) {
                web.evaluateJavascript("JSON.stringify(window.FamilyBoardDevice?.status?.()||{})", raw -> {
                    try {
                        String value = (String)new JSONTokener(raw).nextValue();
                        JSONObject s = new JSONObject(value);
                        WindowManager.LayoutParams p = getWindow().getAttributes();
                        p.screenBrightness = s.optBoolean("blackout") ? 0.01f : -1f;
                        getWindow().setAttributes(p);
                    } catch (Exception ignored) { }
                });
            }
            timer.postDelayed(this, 2000);
        }
    };
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        base = getPreferences(0).getString("server", "");
        if (base.isEmpty()) setup(); else showBoard();
    }
    private boolean sameOrigin(String target) {
        try {
            URI a = URI.create(base), b = URI.create(target);
            return a.getScheme().equals(b.getScheme()) && a.getHost().equals(b.getHost()) && a.getPort()==b.getPort();
        } catch (Exception e) { return false; }
    }
    private String normalized(String value) throws Exception {
        URI u = new URI(value.trim());
        if (!"https".equals(u.getScheme()) || u.getHost()==null || u.getUserInfo()!=null || u.getQuery()!=null || u.getFragment()!=null || !(u.getPath().isEmpty() || u.getPath().equals("/")))
            throw new Exception("Tailscale의 https://서버이름.…ts.net 주소만 입력해 주세요.");
        return "https://" + u.getRawAuthority();
    }
    private void setup() {
        timer.removeCallbacks(displayTick);
        if (web!=null) {web.destroy();web=null;}
        WindowManager.LayoutParams lighting=getWindow().getAttributes();lighting.screenBrightness=-1f;getWindow().setAttributes(lighting);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        LinearLayout form = new LinearLayout(this); form.setOrientation(LinearLayout.VERTICAL); form.setPadding(60,40,60,40); form.setBackgroundColor(Color.rgb(249,247,240));
        TextView title = new TextView(this); title.setText("FamilyBoard · 거실 전광판"); title.setTextSize(30); form.addView(title);
        TextView help = new TextView(this); help.setText("태블릿에서 Tailscale을 켜고 Ubuntu 서버 주소를 입력하세요.\n예시 주소는 실제 접속 주소가 아닙니다."); help.setPadding(0,20,0,20); form.addView(help);
        EditText address = new EditText(this); address.setSingleLine(true); address.setInputType(17); address.setHint("https://서버이름.tailnet이름.ts.net"); address.setText(base); form.addView(address);
        Button go = new Button(this); go.setText("전광판 연결"); form.addView(go);
        go.setOnClickListener(v -> {try {base=normalized(address.getText().toString());getPreferences(0).edit().putString("server",base).apply();showBoard();}catch(Exception e){address.setError(e.getMessage());}});
        TextView note = new TextView(this); note.setText("주소 변경: 태블릿 뒤로 버튼 → 서버 주소 변경\n꺼짐은 검은 화면 + 최저 밝기입니다. 앱이 열려 있을 때 작동하며 OS 잠금은 별도 설정입니다."); form.addView(note);
        setContentView(form);
    }
    private void showBoard() {
        if (web!=null) web.destroy();
        web = new WebView(this); web.setBackgroundColor(Color.BLACK);
        WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                if (sameOrigin(req.getUrl().toString())) return false;
                if (req.isForMainFrame() && "https".equals(req.getUrl().getScheme())) {
                    try {startActivity(new Intent(Intent.ACTION_VIEW,req.getUrl()));}catch(Exception ignored){}
                }
                return true;
            }
            @Override public void onPageFinished(WebView view,String url) {
                if(sameOrigin(url))view.evaluateJavascript("document.documentElement.classList.add('native-tablet')",null);
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest req,WebResourceError e) {
                if(req.isForMainFrame()) new AlertDialog.Builder(MainActivity.this).setTitle("서버에 연결하지 못했어요").setMessage("Tailscale 연결과 Ubuntu 서버 실행 상태를 확인해 주세요.\n"+base).setPositiveButton("다시 연결",(d,w)->web.loadUrl(base+"/#board")).setNegativeButton("주소 변경",(d,w)->setup()).show();
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams params){
                if(files!=null)files.onReceiveValue(null);files=cb;
                try{startActivityForResult(params.createIntent(),8);return true;}catch(Exception e){files=null;return false;}
            }
        });
        setContentView(web);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        web.loadUrl(base+"/#board");timer.removeCallbacks(displayTick);timer.post(displayTick);
    }
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==8&&files!=null){files.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));files=null;}}
    @Override public void onBackPressed(){new AlertDialog.Builder(this).setItems(new String[]{"전광판으로 돌아가기","서버 주소 변경","앱 종료"},(d,i)->{if(i==1)setup();if(i==2)finish();}).show();}
    @Override protected void onResume(){super.onResume();timer.removeCallbacks(displayTick);timer.post(displayTick);}
    @Override protected void onPause(){super.onPause();timer.removeCallbacks(displayTick);}
    @Override protected void onDestroy(){timer.removeCallbacks(displayTick);if(web!=null)web.destroy();super.onDestroy();}
}
