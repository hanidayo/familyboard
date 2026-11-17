import SwiftUI
import WebKit

@main
struct FamilyBoardApp: App {
    var body: some Scene { WindowGroup { BoardHome() } }
}

struct BoardHome: View {
    @AppStorage("server") private var server = ""
    @State private var editing = false
    @State private var address = ""
    @State private var error = ""
    var body: some View {
        NavigationStack {
            Group {
                if server.isEmpty || editing {
                    Form {
                        Section("가족 전용 서버 연결") {
                            Text("아이폰에서 Tailscale을 켜고 Ubuntu 서버의 HTTPS 주소를 입력하세요.")
                            TextField("https://서버이름.tailnet이름.ts.net", text: $address)
                                .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                            Text("위 주소 형식은 예시이며 실제 주소가 아닙니다.").font(.caption)
                            if !error.isEmpty { Text(error).foregroundStyle(.red) }
                            Button("관리 화면 연결") { connect() }
                        }
                    }.navigationTitle("FamilyBoard")
                } else {
                    BoardWeb(base: server).id(server).navigationTitle("FamilyBoard")
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar { Button { address=server; editing=true } label: { Image(systemName:"gearshape") }.accessibilityLabel("서버 주소 변경") }
                }
            }
        }.tint(Color(red:0.19,green:0.34,blue:0.28))
    }
    private func connect() {
        guard let c=URLComponents(string:address.trimmingCharacters(in:.whitespacesAndNewlines)), c.scheme=="https", let host=c.host, !host.isEmpty, c.user==nil, c.password==nil, c.query==nil, c.fragment==nil, (c.path.isEmpty || c.path=="/") else {
            error="Tailscale의 HTTPS 서버 주소만 입력해 주세요."; return
        }
        var origin=c; origin.path="";server=origin.string!;error="";editing=false
    }
}

struct BoardWeb: UIViewRepresentable {
    let base: String
    func makeCoordinator() -> Coordinator { Coordinator(base:base) }
    func makeUIView(context:Context) -> WKWebView {
        let config=WKWebViewConfiguration()
        let web=WKWebView(frame:.zero,configuration:config)
        web.navigationDelegate=context.coordinator;web.uiDelegate=context.coordinator
        web.allowsBackForwardNavigationGestures=true
        web.scrollView.contentInsetAdjustmentBehavior = .automatic
        web.load(URLRequest(url:URL(string:base+"/#admin")!))
        return web
    }
    func updateUIView(_ view:WKWebView,context:Context) {}
    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let origin: URL
        init(base:String) { origin=URL(string:base)! }
        func sameOrigin(_ url:URL) -> Bool { url.scheme==origin.scheme && url.host==origin.host && url.port==origin.port }
        func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void) {
            guard let url=action.request.url else {decisionHandler(.cancel);return}
            if sameOrigin(url) || url.absoluteString=="about:blank" {decisionHandler(.allow);return}
            if url.scheme=="https" {UIApplication.shared.open(url)}
            decisionHandler(.cancel)
        }
        func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!) {
            webView.evaluateJavaScript("document.documentElement.classList.add('native-iphone')",completionHandler:nil)
        }
        func webView(_ webView:WKWebView,createWebViewWith config:WKWebViewConfiguration,for action:WKNavigationAction,windowFeatures:WKWindowFeatures)->WKWebView? {
            if let url=action.request.url {if sameOrigin(url){webView.load(action.request)}else if url.scheme=="https" {UIApplication.shared.open(url)}};return nil
        }
        func webView(_ webView:WKWebView,didFailProvisionalNavigation navigation:WKNavigation!,withError error:Error) {
            if (error as NSError).code==NSURLErrorCancelled{return}
            let alert=UIAlertController(title:"서버에 연결하지 못했어요",message:"Tailscale 연결과 Ubuntu 서버 실행 상태를 확인해 주세요.",preferredStyle:.alert)
            alert.addAction(UIAlertAction(title:"다시 연결",style:.default){_ in webView.load(URLRequest(url:URL(string:self.origin.absoluteString+"/#admin")!))})
            if let root=webView.window?.rootViewController {var top=root;while let p=top.presentedViewController{top=p};top.present(alert,animated:true)}
        }
    }
}
