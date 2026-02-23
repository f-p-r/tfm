import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTableComponent } from './admin-table.component';
import { AdminTableColumn, AdminTableAction } from './admin-table.model';
import { By } from '@angular/platform-browser';

// --- helpers ----------------------------------------------------------

const TEXT_COLUMNS: AdminTableColumn[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'age', label: 'Edad', type: 'text' },
];

const NUMERIC_COLUMNS: AdminTableColumn[] = [
  { key: 'score', label: 'Score', type: 'text' },
];

const rows10 = Array.from({ length: 10 }, (_, i) => ({
  name: `User ${String.fromCharCode(65 + i)}`,
  age: 20 + i,
  score: 100 - i,
}));

const rows20 = Array.from({ length: 20 }, (_, i) => ({
  name: `User ${String.fromCharCode(65 + i)}`,
  age: 20 + i,
}));

function setup(
  columns: AdminTableColumn[] = TEXT_COLUMNS,
  data: any[] = [],
  actions: AdminTableAction[] = [],
  pageSize = 15,
  isLoading = false,
) {
  TestBed.configureTestingModule({ imports: [AdminTableComponent] });

  const fixture = TestBed.createComponent(AdminTableComponent);
  const component = fixture.componentInstance as any; // acceso a miembros protegidos
  component.columns = columns;
  component.data = data;
  component.actions = actions;
  component.pageSize = pageSize;
  component.isLoading = isLoading;
  fixture.detectChanges();
  return { fixture, component: component as any };
}

// --- tests ----------------------------------------------------------

describe('AdminTableComponent', () => {
  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------- loading
  describe('loading state', () => {
    it('shows "Cargando..." when isLoading=true', () => {
      const { fixture } = setup(TEXT_COLUMNS, [], [], 15, true);
      expect(fixture.nativeElement.textContent).toContain('Cargando');
    });

    it('shows "No hay registros" when isLoading=false and data is empty', () => {
      const { fixture } = setup(TEXT_COLUMNS, [], [], 15, false);
      expect(fixture.nativeElement.textContent).toContain('No hay registros');
    });
  });

  // ---------------------------------------------------------- headers
  describe('column headers', () => {
    it('renders column labels in th', () => {
      const { fixture } = setup();
      const ths = fixture.nativeElement.querySelectorAll('thead th');
      expect(ths[0].textContent).toContain('Nombre');
      expect(ths[1].textContent).toContain('Edad');
    });

    it('renders an extra "Acciones" th when actions are provided', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows10, [{ label: 'Editar', action: 'edit' }]);
      const ths = fixture.nativeElement.querySelectorAll('thead th');
      const last = ths[ths.length - 1];
      expect(last.textContent).toContain('Acciones');
    });

    it('does NOT render Acciones th when no actions', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows10);
      const ths = fixture.nativeElement.querySelectorAll('thead th');
      expect(ths).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------- pagination
  describe('pagination', () => {
    it('shows first pageSize items', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows20, [], 5);
      const trs = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(trs).toHaveLength(5);
    });

    it('shows "1-5 de 20" pagination info', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows20, [], 5);
      expect(fixture.nativeElement.textContent).toContain('1-5');
      expect(fixture.nativeElement.textContent).toContain('20');
    });

    it('shows "0-0 de 0" when no data', () => {
      const { fixture } = setup(TEXT_COLUMNS, [], [], 5);
      expect(fixture.nativeElement.textContent).toContain('0-0');
      expect(fixture.nativeElement.textContent).toContain('de 0');
    });

    it('navigates to next page via > button', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows20, [], 5);
      const buttons = fixture.nativeElement.querySelectorAll('.ds-table-pagination button');
      const nextBtn: HTMLButtonElement = buttons[1]; // '>' button
      nextBtn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('6-10');
    });

    it('navigates back to previous page via < button', () => {
      const { fixture, component } = setup(TEXT_COLUMNS, rows20, [], 5);
      component.changePage(2);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('.ds-table-pagination button');
      const prevBtn: HTMLButtonElement = buttons[0]; // '<' button
      prevBtn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('1-5');
    });

    it('< button is disabled on first page', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows20, [], 5);
      const buttons = fixture.nativeElement.querySelectorAll('.ds-table-pagination button') as NodeListOf<HTMLButtonElement>;
      expect(buttons[0].disabled).toBe(true);
    });

    it('> button is disabled on last page', () => {
      const { fixture, component } = setup(TEXT_COLUMNS, rows20, [], 20);
      // los 20 registros caben en la primera página
      const buttons = fixture.nativeElement.querySelectorAll('.ds-table-pagination button') as NodeListOf<HTMLButtonElement>;
      expect(buttons[1].disabled).toBe(true);
    });
  });

  // ---------------------------------------------------------- sorting
  describe('sorting', () => {
    it('sorts ascending on first column header click', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows10);
      const th = fixture.nativeElement.querySelector('thead th');
      th.click();
      fixture.detectChanges();
      const cells = fixture.nativeElement.querySelectorAll('tbody tr td:first-child span');
      expect(cells[0].textContent.trim()).toBe('User A');
    });

    it('sorts descending on second click of same column', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows10);
      const th = fixture.nativeElement.querySelector('thead th');
      th.click(); fixture.detectChanges();
      th.click(); fixture.detectChanges();
      const cells = fixture.nativeElement.querySelectorAll('tbody tr td:first-child span');
      expect(cells[0].textContent.trim()).toBe('User J');
    });

    it('shows sort indicator (▲) when column is sorted ascending', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows10);
      const th = fixture.nativeElement.querySelector('thead th');
      th.click(); fixture.detectChanges();
      expect(th.textContent).toContain('▲');
    });

    it('shows sort indicator (▼) when column is sorted descending', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows10);
      const th = fixture.nativeElement.querySelector('thead th');
      th.click(); fixture.detectChanges();
      th.click(); fixture.detectChanges();
      expect(th.textContent).toContain('▼');
    });

    it('resets to page 1 when sort changes', () => {
      const { fixture, component } = setup(TEXT_COLUMNS, rows20, [], 5);
      component.changePage(3);
      fixture.detectChanges();
      const th = fixture.nativeElement.querySelector('thead th');
      th.click(); fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('1-5');
    });

    it('sorts numbers numerically', () => {
      const numData = [{ score: 100 }, { score: 9 }, { score: 45 }];
      const { fixture } = setup(NUMERIC_COLUMNS, numData);
      const th = fixture.nativeElement.querySelector('thead th');
      th.click(); fixture.detectChanges();
      const cells = fixture.nativeElement.querySelectorAll('tbody tr td span');
      expect(cells[0].textContent.trim()).toBe('9');
    });
  });

  // ---------------------------------------------------------- actions
  describe('actions', () => {
    it('renders action buttons per row', () => {
      const { fixture } = setup(TEXT_COLUMNS, rows10, [{ label: 'Editar', action: 'edit' }]);
      const actionBtns = fixture.nativeElement.querySelectorAll('td button');
      expect(actionBtns).toHaveLength(10);
    });

    it('emits action event with row data on button click', () => {
      const { fixture, component } = setup(TEXT_COLUMNS, [{ name: 'Alice', age: 30 }], [{ label: 'Editar', action: 'edit' }]);
      const emitted: any[] = [];
      component.action.subscribe((v: any) => emitted.push(v));
      const btn = fixture.nativeElement.querySelector('td button');
      btn.click();
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual({ action: 'edit', row: { name: 'Alice', age: 30 } });
    });

    it('disables button when disabledWhen returns true', () => {
      const { fixture } = setup(
        TEXT_COLUMNS,
        [{ name: 'Alice', age: 30 }],
        [{ label: 'Borrar', action: 'delete', disabledWhen: (row: any) => row.age > 25 }],
      );
      const btn = fixture.nativeElement.querySelector('td button') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('enables button when disabledWhen returns false', () => {
      const { fixture } = setup(
        TEXT_COLUMNS,
        [{ name: 'Alice', age: 20 }],
        [{ label: 'Borrar', action: 'delete', disabledWhen: (row: any) => row.age > 25 }],
      );
      const btn = fixture.nativeElement.querySelector('td button') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });
  });

  // ---------------------------------------------------------- rowClick
  describe('rowClick output', () => {
    it('emits rowClick when a row is clicked', () => {
      const row = { name: 'Alice', age: 30 };
      const { fixture, component } = setup(TEXT_COLUMNS, [row]);
      const emitted: any[] = [];
      component.rowClick.subscribe((r: any) => emitted.push(r));
      const tr = fixture.nativeElement.querySelector('tbody tr');
      tr.click();
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(row);
    });
  });

  // ---------------------------------------------------------- cellChange
  describe('cellChange output (select type)', () => {
    it('emits cellChange on select change', () => {
      const selectCol: AdminTableColumn = {
        key: 'status',
        label: 'Estado',
        type: 'select',
        selectOptions: [
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' },
        ],
      };
      const row = { status: 'active' };
      const { fixture, component } = setup([selectCol], [row]);
      const emitted: any[] = [];
      component.cellChange.subscribe((v: any) => emitted.push(v));

      const select = fixture.nativeElement.querySelector('select');
      select.value = 'inactive';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].col).toBe('status');
      expect(emitted[0].value).toBe('inactive');
    });
  });

  // ---------------------------------------------------------- cell types
  describe('cell rendering by type', () => {
    it('renders date column with dd/MM/yyyy format', () => {
      const dateCol: AdminTableColumn = { key: 'created', label: 'Fecha', type: 'date' };
      const { fixture } = setup([dateCol], [{ created: '2024-01-15' }]);
      const td = fixture.nativeElement.querySelector('td');
      expect(td.textContent).toContain('15/01/2024');
    });

    it('renders badge column with ds-badge class', () => {
      const badgeCol: AdminTableColumn = {
        key: 'status', label: 'Estado', type: 'badge',
        badgeConfig: { active: 'ds-badge-active' },
        badgeLabels: { active: 'Activo' },
      };
      const { fixture } = setup([badgeCol], [{ status: 'active' }]);
      const badge = fixture.nativeElement.querySelector('.ds-badge');
      expect(badge).not.toBeNull();
      expect(badge.textContent.trim()).toBe('Activo');
      expect(badge.classList.contains('ds-badge-active')).toBe(true);
    });

    it('renders link column with href', () => {
      const linkCol: AdminTableColumn = { key: 'email', label: 'Email', type: 'link', linkPrefix: 'mailto:' };
      const { fixture } = setup([linkCol], [{ email: 'a@b.com' }]);
      const link = fixture.nativeElement.querySelector('a');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('mailto:a@b.com');
    });

    it('renders link with # when value is empty', () => {
      const linkCol: AdminTableColumn = { key: 'email', label: 'Email', type: 'link' };
      const { fixture } = setup([linkCol], [{ email: '' }]);
      const link = fixture.nativeElement.querySelector('a');
      expect(link.getAttribute('href')).toBe('#');
    });

    it('renders default text for unknown type', () => {
      const { fixture } = setup([{ key: 'name', label: 'Nombre' }], [{ name: 'Alice' }]);
      const span = fixture.nativeElement.querySelector('td span');
      expect(span.textContent.trim()).toBe('Alice');
    });
  });

  // ---------------------------------------------------------- alignment helpers
  describe('getHeaderClass / getCellClass', () => {
    it('adds text-right class when align=right', () => {
      const col: AdminTableColumn = { key: 'x', label: 'X', align: 'right' };
      const { component } = setup([col]);
      expect(component.getHeaderClass(col)).toContain('text-right');
      expect(component.getCellClass(col)).toContain('text-right');
    });

    it('adds text-center class when align=center', () => {
      const col: AdminTableColumn = { key: 'x', label: 'X', align: 'center' };
      const { component } = setup([col]);
      expect(component.getHeaderClass(col)).toContain('text-center');
      expect(component.getCellClass(col)).toContain('text-center');
    });

    it('no alignment class when align is unset', () => {
      const col: AdminTableColumn = { key: 'x', label: 'X' };
      const { component } = setup([col]);
      expect(component.getHeaderClass(col)).not.toContain('text-right');
      expect(component.getHeaderClass(col)).not.toContain('text-center');
    });
  });

  // ---------------------------------------------------------- badge helpers
  describe('getBadgeClass / getBadgeLabel', () => {
    it('returns badge class for known value', () => {
      const col: AdminTableColumn = { key: 's', label: 'S', badgeConfig: { ok: 'ds-badge-ok' } };
      const { component } = setup([col]);
      expect(component.getBadgeClass(col, 'ok')).toBe('ds-badge-ok');
    });

    it('returns empty string for unknown value', () => {
      const col: AdminTableColumn = { key: 's', label: 'S', badgeConfig: {} };
      const { component } = setup([col]);
      expect(component.getBadgeClass(col, 'missing')).toBe('');
    });

    it('returns label for known value', () => {
      const col: AdminTableColumn = { key: 's', label: 'S', badgeLabels: { ok: 'OK label' } };
      const { component } = setup([col]);
      expect(component.getBadgeLabel(col, 'ok')).toBe('OK label');
    });

    it('falls back to value when label not found', () => {
      const col: AdminTableColumn = { key: 's', label: 'S', badgeLabels: {} };
      const { component } = setup([col]);
      expect(component.getBadgeLabel(col, 'fallback')).toBe('fallback');
    });
  });

  // ---------------------------------------------------------- getLinkHref
  describe('getLinkHref', () => {
    it('prepends linkPrefix to value', () => {
      const col: AdminTableColumn = { key: 'e', label: 'E', linkPrefix: 'mailto:' };
      const { component } = setup([col]);
      expect(component.getLinkHref(col, 'a@b.com')).toBe('mailto:a@b.com');
    });

    it('uses value as-is when no linkPrefix', () => {
      const col: AdminTableColumn = { key: 'e', label: 'E' };
      const { component } = setup([col]);
      expect(component.getLinkHref(col, 'https://example.com')).toBe('https://example.com');
    });

    it('returns # when value is empty', () => {
      const col: AdminTableColumn = { key: 'e', label: 'E' };
      const { component } = setup([col]);
      expect(component.getLinkHref(col, '')).toBe('#');
    });
  });

  // ---------------------------------------------------------- date sorting
  describe('date column sorting', () => {
    it('sorts date columns chronologically', () => {
      const dateCol: AdminTableColumn = { key: 'created', label: 'Fecha', type: 'date' };
      const data = [
        { created: '2024-03-01' },
        { created: '2024-01-01' },
        { created: '2024-02-01' },
      ];
      const { fixture, component } = setup([dateCol], data);
      component.onHeaderClick('created');
      fixture.detectChanges();
      const cells = fixture.nativeElement.querySelectorAll('td');
      expect(cells[0].textContent).toContain('01/01/2024');
    });
  });
});
