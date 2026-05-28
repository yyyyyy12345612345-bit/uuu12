package com.yaqeen.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable hardware acceleration for smooth animations
        getWindow().getDecorView().setLayerType(View.LAYER_TYPE_HARDWARE, null);
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Optimize WebView performance
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();
            
            // Enable hardware acceleration
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            
            // Optimize rendering
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            
            // Enable DOM storage for better performance
            settings.setDomStorageEnabled(true);
            
            // Enable database storage
            settings.setDatabaseEnabled(true);
            
            // Optimize cache
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Enable zoom (if needed)
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            
            // Disable unnecessary features
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(false);
            
            // Optimize text rendering
            settings.setTextZoom(100);
            
            // Enable JavaScript optimizations
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setLoadsImagesAutomatically(true);
            
            // Reduce memory usage
            webView.clearCache(false);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        
        // Resume WebView
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().resumeTimers();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        
        // Pause WebView to save battery
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().pauseTimers();
        }
    }
}
