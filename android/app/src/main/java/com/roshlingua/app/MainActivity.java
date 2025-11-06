package com.roshlingua.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable web debugging
        android.webkit.WebView.setWebContentsDebuggingEnabled(true);
    }
}
