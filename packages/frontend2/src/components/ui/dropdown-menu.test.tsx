/**
 * Dropdown Menu Component Tests
 *
 * WHY: Test the Radix UI dropdown menu component renders correctly
 * and handles interactions properly.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
} from './dropdown-menu';

describe('DropdownMenu', () => {
  it('renders trigger button', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    expect(trigger).toBeDefined();
  });

  it('opens menu on trigger click', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    // Menu items should be visible after clicking trigger
    const item1 = screen.getByText('Item 1');
    const item2 = screen.getByText('Item 2');
    expect(item1).toBeDefined();
    expect(item2).toBeDefined();
  });

  it('renders menu label', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    const label = screen.getByText('My Account');
    expect(label).toBeDefined();
  });

  it('renders separator', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    const item1 = screen.getByText('Item 1');
    const item2 = screen.getByText('Item 2');
    expect(item1).toBeDefined();
    expect(item2).toBeDefined();
  });

  it('handles menu item click', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleClick}>
            Clickable Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    const item = screen.getByText('Clickable Item');
    await user.click(item);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders checkbox items', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={true}>
            Checked Item
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>
            Unchecked Item
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    const checkedItem = screen.getByText('Checked Item');
    const uncheckedItem = screen.getByText('Unchecked Item');
    expect(checkedItem).toBeDefined();
    expect(uncheckedItem).toBeDefined();
  });

  it('renders radio group items', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="option1">
            <DropdownMenuRadioItem value="option1">
              Option 1
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="option2">
              Option 2
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    const option1 = screen.getByText('Option 1');
    const option2 = screen.getByText('Option 2');
    expect(option1).toBeDefined();
    expect(option2).toBeDefined();
  });

  it('renders menu shortcut', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Save
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    const shortcut = screen.getByText('⌘S');
    expect(shortcut).toBeDefined();
    expect(shortcut.className).toContain('ml-auto');
  });

  it('renders with custom className on menu item', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="custom-class">
            Custom Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    const item = screen.getByText('Custom Item');
    expect(item.className).toContain('custom-class');
  });

  it('renders inset menu item', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>
            Inset Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    const item = screen.getByText('Inset Item');
    expect(item.className).toContain('pl-8');
  });

  it('closes menu when pressing Escape', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText('Open Menu');
    await user.click(trigger);

    // Menu item should be visible
    expect(screen.getByText('Item 1')).toBeDefined();

    // Press Escape to close menu
    await user.keyboard('{Escape}');

    // Menu item should no longer be in the document
    expect(screen.queryByText('Item 1')).toBeNull();
  });
});
