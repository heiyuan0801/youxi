package com.cocos.game;

import android.app.Activity;
import android.os.Build;
import android.view.Display;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.WindowManager;

import java.lang.ref.WeakReference;

public final class QingyeFrameRate {
    private static volatile WeakReference<QingyeFrameRate> current = new WeakReference<>(null);
    private static volatile int target = 60;

    private final Activity activity;
    private final SurfaceView view;

    private QingyeFrameRate(Activity activity, SurfaceView view) {
        this.activity = activity;
        this.view = view;
    }

    static void install(Activity activity, SurfaceView view) {
        QingyeFrameRate controller = new QingyeFrameRate(activity, view);
        current = new WeakReference<>(controller);
        view.getHolder().addCallback(new SurfaceHolder.Callback() {
            @Override public void surfaceCreated(SurfaceHolder holder) { controller.apply(); }
            @Override public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) { controller.apply(); }
            @Override public void surfaceDestroyed(SurfaceHolder holder) {}
        });
        controller.apply();
    }

    public static void setTarget(int fps) {
        target = fps == 120 ? 120 : 60;
        QingyeFrameRate controller = current.get();
        if (controller != null) controller.activity.runOnUiThread(controller::apply);
    }

    private void apply() {
        if (current.get() != this || activity.isFinishing() || activity.isDestroyed()) return;
        Display display = view.getDisplay();
        if (display == null) return;
        Display.Mode active = display.getMode();
        Display.Mode preferred = null;
        for (Display.Mode mode : display.getSupportedModes()) {
            if (mode.getPhysicalWidth() != active.getPhysicalWidth()
                    || mode.getPhysicalHeight() != active.getPhysicalHeight()
                    || mode.getRefreshRate() > target + 0.5f) continue;
            if (preferred == null || mode.getRefreshRate() > preferred.getRefreshRate()) preferred = mode;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Surface surface = view.getHolder().getSurface();
            if (surface != null && surface.isValid()) {
                float rate = preferred == null ? target : preferred.getRefreshRate();
                try {
                    surface.setFrameRate(rate, Surface.FRAME_RATE_COMPATIBILITY_DEFAULT);
                } catch (IllegalStateException ignored) {
                    // The surface may have been destroyed between isValid and setFrameRate.
                }
            }
        } else {
            WindowManager.LayoutParams params = activity.getWindow().getAttributes();
            int mode = preferred == null ? 0 : preferred.getModeId();
            if (params.preferredDisplayModeId != mode) {
                params.preferredDisplayModeId = mode;
                activity.getWindow().setAttributes(params);
            }
        }
    }
}
