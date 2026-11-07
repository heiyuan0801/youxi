#import "ViewController.h"
#import "AppDelegate.h"
#import <QuartzCore/CAMetalLayer.h>
@implementation ViewController
- (BOOL)shouldAutorotate { return YES; }
- (UIInterfaceOrientationMask)supportedInterfaceOrientations { return UIInterfaceOrientationMaskLandscape; }
- (BOOL)prefersStatusBarHidden { return YES; }
- (UIRectEdge)preferredScreenEdgesDeferringSystemGestures { return UIRectEdgeBottom; }
- (BOOL)prefersHomeIndicatorAutoHidden { return NO; }
- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator {
    [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
    AppDelegate *app = (AppDelegate *)UIApplication.sharedApplication.delegate;
    if (!app.engineReady) return;
    [app.appDelegateBridge viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
    CGFloat scale = [app.appDelegateBridge getPixelRatio];
    ((CAMetalLayer *)self.view.layer).drawableSize = CGSizeMake(size.width*scale,size.height*scale);
}
@end
