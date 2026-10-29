#!/usr/bin/env bash
# Windows 上使用 Git Bash；仅由本地部署入口 source，服务器脚本不依赖它。
ensure_windows_bash() {
  # PowerShell 的系统 bash.exe 会先进入 WSL，此处立即转到 Windows Git Bash。
  [[ "$(uname -s)" == Linux ]] || return 0
  grep -qi microsoft /proc/sys/kernel/osrelease 2>/dev/null || return 0
  command -v cmd.exe >/dev/null && command -v wslpath >/dev/null || {
    echo '无法从 WSL 启动 Git Bash，请在 Windows 运行 deploy 目录中的 .bat 入口。' >&2
    exit 1
  }
  local script="$1"; shift
  local profile program_files local_appdata candidate git_bash=""
  profile="$(cmd.exe /d /c 'echo %USERPROFILE%' 2>/dev/null | tr -d '\r')"
  program_files="$(cmd.exe /d /c 'echo %ProgramFiles%' 2>/dev/null | tr -d '\r')"
  local_appdata="$(cmd.exe /d /c 'echo %LOCALAPPDATA%' 2>/dev/null | tr -d '\r')"
  if [[ -n "${GIT_BASH:-}" ]]; then
    git_bash="$(wslpath -u "$GIT_BASH")"
  else
    for candidate in "$program_files/Git/bin/bash.exe" "$local_appdata/Programs/Git/bin/bash.exe"; do
      candidate="$(wslpath -u "$candidate")"
      if [[ -x "$candidate" ]]; then git_bash="$candidate"; break; fi
    done
    if [[ -z "$git_bash" ]]; then
      candidate="$(cmd.exe /d /c 'where git.exe' 2>/dev/null | tr -d '\r' | head -1 || true)"
      if [[ -n "$candidate" ]]; then
        candidate="$(wslpath -u "$candidate")"
        git_bash="$(dirname "$(dirname "$candidate")")/bin/bash.exe"
      fi
    fi
  fi
  [[ -n "$git_bash" && -x "$git_bash" ]] || {
    echo '未找到 Git Bash。请安装 Git for Windows，或用 GIT_BASH 指定其 bin/bash.exe。' >&2
    exit 1
  }
  # WSL 会把 HOME=/home/... 传给 Windows 子进程，需要恢复 Windows 用户目录。
  export HOME="${profile//\\//}"
  local name value
  for name in SSH_KEY OFFICIAL_SITE_DIR; do
    value="${!name:-}"
    if [[ "$value" == /* ]]; then
      export "$name=$(wslpath -m "$value")"
    fi
  done
  script="$(wslpath -m "$(cd "$(dirname "$script")" && pwd)/$(basename "$script")")"
  echo '==> Windows 部署切换到 Git Bash；直接运行 .bat 入口可避免启动 WSL。'
  exec "$git_bash" "$script" "$@"
}
