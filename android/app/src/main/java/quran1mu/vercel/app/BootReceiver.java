package quran1mu.vercel.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d("BootReceiver", "Device rebooted, Adhan scheduling will be handled by Capacitor.");
            // Capacitor's LocalNotificationRestoreReceiver already handles restoring scheduled notifications.
            // We can add custom logic here if needed.
        }
    }
}
