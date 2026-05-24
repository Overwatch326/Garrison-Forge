import type { Project, Task } from '../models/projects';
import type { User } from '../models/users';
import { AppConfigStore } from '../models/appConfig';

interface BuildThreadViewProps {
  project: Project;
  tasks: Task[];
  owner: User | null;
}

function htmlToBbcode(html: string): string {
  // Very simple HTML -> BBCode mapper for the subset we generate.
  if (!html) return '';
  let out = html;

  // Paragraphs and line breaks
  out = out.replace(/<p[^>]*>/gi, '');
  out = out.replace(/<\/p>/gi, '\n\n');
  out = out.replace(/<br\s*\/?\s*>/gi, '\n');

  // Bold/italic/underline/strike
  out = out.replace(/<b[^>]*>|<strong[^>]*>/gi, '[b]');
  out = out.replace(/<\/b>|<\/strong>/gi, '[/b]');
  out = out.replace(/<i[^>]*>|<em[^>]*>/gi, '[i]');
  out = out.replace(/<\/i>|<\/em>/gi, '[/i]');
  out = out.replace(/<u[^>]*>/gi, '[u]');
  out = out.replace(/<\/u>/gi, '[/u]');
  out = out.replace(/<s[^>]*>|<strike[^>]*>|<del[^>]*>/gi, '[s]');
  out = out.replace(/<\/s>|<\/strike>|<\/del>/gi, '[/s]');

  // Lists
  out = out.replace(/<ul[^>]*>/gi, '[list]');
  out = out.replace(/<\/ul>/gi, '[/list]');
  out = out.replace(/<ol[^>]*>/gi, '[list=1]');
  out = out.replace(/<\/ol>/gi, '[/list]');
  out = out.replace(/<li[^>]*>/gi, '[*]');
  out = out.replace(/<\/li>/gi, '');

  // Links
  out = out.replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[url=$1]$2[/url]');

  // Strip any remaining tags
  out = out.replace(/<[^>]+>/g, '');

  // Collapse excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}

export function BuildThreadView({ project, tasks, owner }: BuildThreadViewProps) {
  const sorted = [...tasks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const garrison = AppConfigStore.getGarrison();

  const includedTasks = sorted.filter((t) => t.includeInThread !== false);

  const threadText = (() => {
    const lines: string[] = [];
    const header = `${project.name}${project.costumeType ? ` – ${project.costumeType}` : ''}`;
    lines.push(`[b]${header}[/b]`);
    if (garrison.name) {
      lines.push(`[i]${garrison.name}[/i]`);
    }
    if (garrison.threadHeader) {
      lines.push('');
      lines.push(htmlToBbcode(garrison.threadHeader));
    }
    lines.push('');

    includedTasks.forEach((task) => {
      const date = new Date(task.createdAt).toLocaleDateString();
      const title = `${task.title} (${date})`;
      lines.push(`[b]${title}[/b]`);

      if (task.descriptionHtml) {
        lines.push(htmlToBbcode(task.descriptionHtml));
      } else {
        lines.push('[i]No detailed notes for this step yet.[/i]');
      }

      if (task.images && task.images.length > 0) {
        lines.push('');
        lines.push('[i]Photos:[/i]');
        // For now we just show a placeholder; when we have real URLs we can emit [img] tags.
        task.images.forEach((_img, idx) => {
          lines.push(`- Photo ${idx + 1}`);
        });
      }

      lines.push('');
    });

    if (owner) {
      lines.push('--');
      if (owner.displayName) {
        lines.push(owner.displayName);
      }
      if (owner.legionId) {
        lines.push(owner.legionId);
      }
    }

    return lines.join('\n');
  })();

  function handleCopy() {
    navigator.clipboard
      .writeText(threadText)
      .catch(() => {
        // ignore copy failures for now
      });
  }

  return (
    <div className="card-surface p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Build Thread Preview
          </h3>
          <p className="text-[11px] text-slate-500">
            This view flattens your tasks into a forum-style build log. Use the button to copy
            BBCode for posting on your garrison forum.
          </p>
        </div>
        <button type="button" className="btn-secondary text-[11px]" onClick={handleCopy}>
          Copy BBCode
        </button>
      </div>

      <textarea
        readOnly
        className="w-full h-64 text-[11px] bg-slate-950/70 border border-slate-800 rounded-md p-2 font-mono text-slate-100"
        value={threadText}
      />
    </div>
  );
}
