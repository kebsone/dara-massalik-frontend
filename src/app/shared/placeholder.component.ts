import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'dm-placeholder',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="page-enter space-y-6">
      <div><p class="text-sm font-medium text-[var(--brand-primary)]">Dahira</p><h1 class="text-2xl font-bold text-slate-900">{{ title() }}</h1><p class="mt-1 text-sm text-slate-500">Le parcours sera détaillé après validation de l'organisation générale de l'application.</p></div>
      <p-card styleClass="border border-[var(--brand-border)] shadow-sm"><div class="py-12 text-center"><div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-bg)] text-[var(--brand-primary)]"><i class="pi pi-wrench text-2xl"></i></div><p class="mt-4 font-semibold text-slate-700">Structure prête</p><p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Cette fonctionnalité est déjà intégrée à la navigation et pourra être branchée au backend Spring Boot ensuite.</p></div></p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceholderComponent { readonly title = input('Module'); }
