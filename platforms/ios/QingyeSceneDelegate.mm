#import "QingyeSceneDelegate.h"
#import "AppDelegate.h"
#import "service/SDKWrapper.h"
@implementation QingyeSceneDelegate
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
    if (![scene isKindOfClass:UIWindowScene.class]) return;
    AppDelegate *app = (AppDelegate *)UIApplication.sharedApplication.delegate;
    [app attachWindowScene:(UIWindowScene *)scene];
    self.window = app.window;
}
- (void)sceneWillResignActive:(UIScene *)scene {
    AppDelegate *app = (AppDelegate *)UIApplication.sharedApplication.delegate;
    if (app.engineReady) [app.appDelegateBridge applicationWillResignActive:UIApplication.sharedApplication];
    [[SDKWrapper shared] applicationWillResignActive:UIApplication.sharedApplication];
}
- (void)sceneDidBecomeActive:(UIScene *)scene {
    AppDelegate *app = (AppDelegate *)UIApplication.sharedApplication.delegate;
    if (app.engineReady) [app.appDelegateBridge applicationDidBecomeActive:UIApplication.sharedApplication];
    [[SDKWrapper shared] applicationDidBecomeActive:UIApplication.sharedApplication];
}
- (void)sceneDidEnterBackground:(UIScene *)scene {
    [[SDKWrapper shared] applicationDidEnterBackground:UIApplication.sharedApplication];
}
- (void)sceneWillEnterForeground:(UIScene *)scene {
    [[SDKWrapper shared] applicationWillEnterForeground:UIApplication.sharedApplication];
}
@end
