using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
[assembly: AssemblyTitle("Перекуп: второй шанс")]
[assembly: AssemblyCompany("Vithel")]
[assembly: AssemblyProduct("Перекуп: второй шанс")]
[assembly: AssemblyVersion("0.9.0.0")]
[assembly: AssemblyFileVersion("0.9.0.0")]
internal sealed class GameWindow : Form {
    private readonly WebView2 view = new WebView2();
    private readonly Label loading = new Label();
    private FormWindowState savedState; private FormBorderStyle savedBorder; private Rectangle savedBounds;
    private bool fullScreen;
    public GameWindow() {
        Text = "Перекуп: второй шанс · Vithel";
        ClientSize = new Size(1280, 800); MinimumSize = new Size(960, 640);
        StartPosition = FormStartPosition.CenterScreen; BackColor = Color.FromArgb(28, 61, 69); KeyPreview = true;
        using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("game.ico")) { if (stream != null) Icon = new Icon(stream); }
        view.Dock = DockStyle.Fill; view.DefaultBackgroundColor = BackColor; Controls.Add(view);
        loading.Text = "ПЕРЕКУП: ВТОРОЙ ШАНС\n\nОткрываем мастерскую…\n\nF11 — полный экран";
        loading.ForeColor = Color.FromArgb(240, 236, 215); loading.Font = new Font("Segoe UI", 18); loading.TextAlign = ContentAlignment.MiddleCenter; loading.Dock = DockStyle.Fill; loading.BackColor = BackColor; Controls.Add(loading); loading.BringToFront();
        Shown += async delegate {
            try {
                string folder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "game");
                if (!File.Exists(Path.Combine(folder, "index.html"))) throw new IOException("Не найдены файлы игры. Переустановите игру или распакуйте весь архив.");
                string profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Vithel", "Perekup", "WebView2");
                CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(null, profile, null);
                await view.EnsureCoreWebView2Async(environment);
                var settings = view.CoreWebView2.Settings; settings.AreDefaultContextMenusEnabled = false; settings.IsStatusBarEnabled = false; settings.AreDevToolsEnabled = false; settings.IsZoomControlEnabled = false;
                view.CoreWebView2.SetVirtualHostNameToFolderMapping("perekup.local", folder, CoreWebView2HostResourceAccessKind.DenyCors);
                view.CoreWebView2.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs e) { if (!e.Uri.StartsWith("https://perekup.local/", StringComparison.OrdinalIgnoreCase)) e.Cancel = true; };
                view.CoreWebView2.NewWindowRequested += delegate(object sender, CoreWebView2NewWindowRequestedEventArgs e) { e.Handled = true; };
                view.NavigationCompleted += delegate(object sender, CoreWebView2NavigationCompletedEventArgs e) { if (e.IsSuccess) { loading.Visible = false; view.Focus(); } else loading.Text = "Не удалось загрузить игру: " + e.WebErrorStatus; };
                view.CoreWebView2.ProcessFailed += delegate { loading.Text = "Графическая подсистема остановилась.\nПерезапустите игру и обновите Microsoft Edge WebView2."; loading.Visible = true; };
                view.CoreWebView2.WebMessageReceived += delegate(object sender, CoreWebView2WebMessageReceivedEventArgs e) { if (e.Source.StartsWith("https://perekup.local/", StringComparison.OrdinalIgnoreCase) && e.TryGetWebMessageAsString() == "fullscreen") ToggleFullScreen(); };
                await view.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync("document.addEventListener('keydown',function(e){if(e.code==='F11'){e.preventDefault();window.chrome.webview.postMessage('fullscreen');}});");
                view.Source = new Uri("https://perekup.local/index.html");
            } catch (WebView2RuntimeNotFoundException) {
                loading.Text = "Для запуска нужен Microsoft Edge WebView2.\nОн обычно уже установлен в Windows 10/11.\nПосле установки игра работает без интернета.";
                if (MessageBox.Show(this, "Открыть официальный сайт установки Microsoft Edge WebView2?", "Не найден WebView2", MessageBoxButtons.YesNo, MessageBoxIcon.Information) == DialogResult.Yes) Process.Start(new ProcessStartInfo("https://developer.microsoft.com/microsoft-edge/webview2/") { UseShellExecute = true });
            } catch (Exception e) { loading.Text = "Не удалось открыть мастерскую.\n" + e.Message; }
        };
        KeyDown += delegate(object sender, KeyEventArgs e) { if (e.KeyCode == Keys.F11) { ToggleFullScreen(); e.Handled = true; } };
    }
    private void ToggleFullScreen() {
        if (!fullScreen) { savedState = WindowState; savedBorder = FormBorderStyle; savedBounds = Bounds; WindowState = FormWindowState.Normal; FormBorderStyle = FormBorderStyle.None; Bounds = Screen.FromControl(this).Bounds; }
        else { FormBorderStyle = savedBorder; Bounds = savedBounds; WindowState = savedState; }
        fullScreen = !fullScreen;
    }
    [STAThread] private static void Main() {
        bool first;
        using (var mutex = new Mutex(true, "Local\\VithelPerekup", out first)) {
            if (!first) { MessageBox.Show("Игра уже открыта.", "Перекуп: второй шанс"); return; }
            Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false); Application.Run(new GameWindow());
        }
    }
}
