package com.krew.mobile;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showLaunchAnimation();
    }

    private void showLaunchAnimation() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(7, 13, 31));

        ImageView mark = new ImageView(this);
        mark.setImageResource(com.krew.mobile.R.drawable.vokter_mark);
        mark.setAlpha(0f);
        mark.setScaleX(.72f);
        mark.setScaleY(.72f);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(148, 148, Gravity.CENTER);
        root.addView(mark, params);
        setContentView(root);

        mark.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(520)
                .withEndAction(() -> {
                    mark.animate().alpha(0f).scaleX(1.12f).scaleY(1.12f).setDuration(280)
                            .withEndAction(this::showStore).start();
                }).start();
    }

    private void showStore() {
        webView = new WebView(this);
        webView.setWebViewClient(new WebViewClient());
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        webView.loadUrl("file:///android_asset/app.html");
        setContentView(webView);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
