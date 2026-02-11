#include <cstdlib>
#include <cstring>
#include <iostream>
#include <optional>
#include <string>
#include <vector>

#if __has_include(<sysexits.h>)
  #include <sysexits.h>
#else
  #define EX_OK 0
  #define EX_USAGE 64
#endif

// --------------------
// trustctl v0.0 starter
// --------------------
//
// Intentional TODOs are left for later lessons.
// This starter compiles and gives you a real place to build from.
// Use tests/run.sh to drive implementation.

static constexpr const char* kVersion = "trustctl 0.0.1";
static constexpr size_t kMaxTokenBytes = 1024; // Lesson 2 mandate

struct TrustHome {
  std::string value;
  std::string source; // default | env | flag
};

struct GlobalOptions {
  bool help = false;
  bool version = false;
  bool testing = false;
  std::optional<std::string> trust_home_flag;
};

static void print_help(std::ostream& out) {
  out
    << "Usage:\n"
    << "  trustctl [--testing] [--trust-home PATH] <command> [args]\n"
    << "\n"
    << "Commands:\n"
    << "  config show        Show resolved TRUST_HOME and its source\n"
    << "  init               Initialize TRUST_HOME directory layout\n"
    << "  wait               Wait until interrupted (Ctrl+C)\n"
    << "\n"
    << "Global options:\n"
    << "  --help             Show this help and exit\n"
    << "  --version          Show version and exit\n"
    << "  --trust-home PATH  Override TRUST_HOME (flag wins)\n"
    << "  --testing          Deterministic output for tests\n"
    << "\n"
    << "Config precedence:\n"
    << "  default < env TRUST_HOME < --trust-home\n";
}

static void print_version(std::ostream& out) {
  out << kVersion << "\n";
}

static bool starts_with(const std::string& s, const std::string& pfx) {
  return s.rfind(pfx, 0) == 0;
}

static bool token_too_large(const std::string& tok) {
  return tok.size() > kMaxTokenBytes;
}

static std::optional<std::string> parse_trust_home(const std::vector<std::string>& args) {
  for (size_t i = 0; i < args.size(); ++i) {
    const std::string& a = args[i];
    const std::string pfx = "--trust-home=";
    if (starts_with(a, pfx)) return a.substr(pfx.size());
    if (a == "--trust-home") {
      if (i + 1 >= args.size()) return std::nullopt; // missing value
      return args[i + 1];
    }
  }
  return std::nullopt;
}

static GlobalOptions parse_global(const std::vector<std::string>& args, std::string& err) {
  GlobalOptions opt;

  for (size_t i = 0; i < args.size(); ++i) {
    const auto& a = args[i];

    // Safety check placeholder:
    // TODO (Lesson 2): reject ANY token > 1024 bytes before doing work.
    // (Right now we only validate flags we parse; tests will force you to harden this.)
    (void)a;

    if (a == "--help") opt.help = true;
    else if (a == "--version") opt.version = true;
    else if (a == "--testing") opt.testing = true;
  }

  // Parse --trust-home (supports both forms)
  // Note: missing value should be a usage error.
  std::optional<std::string> th = parse_trust_home(args);
  if (th) opt.trust_home_flag = th;
  else {
    // If user wrote "--trust-home" without value, record as error.
    for (size_t i = 0; i < args.size(); ++i) {
      if (args[i] == "--trust-home") {
        err = "error: --trust-home requires a value";
        break;
      }
    }
  }

  return opt;
}

static TrustHome resolve_trust_home(const GlobalOptions& opt) {
  TrustHome th;
  th.source = "default";
  th.value = ".trustctl";

  // Prefer HOME if present.
  if (const char* home = std::getenv("HOME")) {
    th.value = std::string(home) + "/.trustctl";
  }

  // In testing mode, default to repo-local path to avoid polluting user machine.
  if (opt.testing) {
    th.value = ".trustctl-test";
    th.source = "default";
  }

  // Env override (12-factor style)
  if (const char* env = std::getenv("TRUST_HOME")) {
    th.value = env;
    th.source = "env";
  }

  // Flag wins
  if (opt.trust_home_flag && !opt.trust_home_flag->empty()) {
    th.value = *opt.trust_home_flag;
    th.source = "flag";
  }

  return th;
}

static int cmd_config_show(const TrustHome& th) {
  std::cout << "trust_home=" << th.value << "\n";
  std::cout << "source=" << th.source << "\n";
  // TODO (Lesson 4): emit structured log line to stderr.
  return EX_OK;
}

static int cmd_init(const TrustHome&) {
  // TODO (Lesson 5): create TRUST_HOME/{logs,store,keys} and be idempotent.
  std::cerr << "error: init not implemented yet\n";
  return EX_USAGE;
}

static int cmd_wait() {
  // TODO (Lesson 3): handle SIGINT and exit 130.
  // For now, just print a message and exit usage.
  std::cerr << "error: wait not implemented yet\n";
  return EX_USAGE;
}

static int usage_error(const std::string& msg) {
  std::cerr << msg << "\n";
  std::cerr << "hint: try --help\n";
  return EX_USAGE;
}

int main(int argc, char** argv) {
  std::vector<std::string> args;
  args.reserve(static_cast<size_t>(argc));
  for (int i = 1; i < argc; ++i) args.emplace_back(argv[i]);

  // TODO (Lesson 2): global token length guard.
  // Implement: if ANY token > 1024 bytes -> print error mentioning 1024 and exit EX_USAGE.

  std::string err;
  GlobalOptions opt = parse_global(args, err);

  // Standard flags (stdout + exit 0)
  if (opt.help) { print_help(std::cout); return EX_OK; }
  if (opt.version) { print_version(std::cout); return EX_OK; }

  if (!err.empty()) {
    return usage_error(err);
  }

  // Extract first non-flag token as command start.
  // TODO (Lesson 2): real router; for now, skip known global flags.
  std::vector<std::string> cmd;
  for (size_t i = 0; i < args.size(); ++i) {
    const auto& a = args[i];
    if (a == "--testing") continue;
    if (a == "--trust-home") { ++i; continue; }
    if (starts_with(a, "--trust-home=")) continue;
    if (!a.empty() && a[0] == '-') continue;
    cmd.assign(args.begin() + static_cast<long>(i), args.end());
    break;
  }

  if (cmd.empty()) {
    return usage_error("error: missing command");
  }

  TrustHome th = resolve_trust_home(opt);

  // Route commands (expand in Lesson 2)
  if (cmd.size() >= 2 && cmd[0] == "config" && cmd[1] == "show") {
    return cmd_config_show(th);
  }
  if (cmd.size() >= 1 && cmd[0] == "init") {
    return cmd_init(th);
  }
  if (cmd.size() >= 1 && cmd[0] == "wait") {
    return cmd_wait();
  }

  return usage_error("error: unknown command: " + cmd[0]);
}
